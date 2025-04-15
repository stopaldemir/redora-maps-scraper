function extractDetailsFromIframe(doc) {
    const name = doc.querySelector("h1.DUwDvf")?.innerText?.trim() || "";
    const address = doc.querySelector("button[data-item-id='address'] .Io6YTe")?.innerText?.trim() || "";
    const phone = doc.querySelector("button[data-item-id^='phone'] .Io6YTe")?.innerText?.trim() || "";
    const website = doc.querySelector("a[data-item-id='authority']")?.href || "";
    const domain = website ? new URL(website).hostname : "";
  
    return {
      uuid: crypto.randomUUID(),
      created_at: new Date().toLocaleDateString(),
      query: document.querySelector('input[aria-label="Arama"]')?.value || "",
      name,
      fulladdr: address,
      local_name: "",
      local_fulladdr: "",
      phone_numbers: phone,
      url: website,
      domain
    };
  }
  
  async function processLinksSequentially(links, index = 0) {
    if (index >= links.length) {
      console.log("✅ Tüm linkler işlendi.");
      return;
    }
  
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = links[index];
  
    iframe.onload = () => {
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      const data = extractDetailsFromIframe(doc);
  
      chrome.storage.local.get("results", (res) => {
        const stored = res.results || [];
        const exists = stored.some((r) => r.name === data.name && r.fulladdr === data.fulladdr);
        if (!exists && data.name) {
          stored.push(data);
          chrome.storage.local.set({ results: stored });
          chrome.runtime.sendMessage({
            type: "UPDATE_BADGE",
            count: stored.length,
          });
          console.log("📥 Arka planda detay eklendi:", data);
        }
      });
  
      setTimeout(() => {
        iframe.remove();
        processLinksSequentially(links, index + 1);
      }, 2000);
    };
  
    document.body.appendChild(iframe);
  }
  