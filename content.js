let storedResults = [];

function extractDetailsFromIframe(doc) {
  const name = doc.querySelector("h1.DUwDvf")?.innerText?.trim() || "";
  const address = doc.querySelector("button[data-item-id='address'] .Io6YTe")?.innerText?.trim() || "";
  const phone = doc.querySelector("button[data-item-id^='phone'] .Io6YTe")?.innerText?.trim() || "";
  const website = doc.querySelector("a[data-item-id='authority']")?.href || "";
  const domain = website ? new URL(website).hostname : "";

  return {
    uuid: crypto.randomUUID(),
    created_at: new Date().toLocaleDateString(),
    name,
    fulladdr: address,
    phone_numbers: phone,
    url: website,
    domain
  };
}

function processLinksSequentially(links, index = 0) {
  if (index >= links.length) {
    console.log("✅ Tüm detay linkleri işlendi.");
    return;
  }

  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  iframe.src = links[index];

  iframe.onload = () => {
    try {
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      const data = extractDetailsFromIframe(doc);

      chrome.storage.local.get("results", (res) => {
        let stored = res.results || [];
        const exists = stored.some((r) => r.name === data.name && r.fulladdr === data.fulladdr);

        if (!exists && data.name) {
          stored.push(data);
          storedResults = stored;
          chrome.storage.local.set({ results: stored });
          chrome.runtime.sendMessage({
            type: "UPDATE_BADGE",
            count: stored.length,
          });
          console.log("📥 Arka planda detay eklendi:", data);
        } else {
          console.log("⏭ Zaten mevcut ya da eksik bilgi:", data.name);
        }
      });
    } catch (err) {
      console.warn("❌ Hata oluştu:", err);
    } finally {
      setTimeout(() => {
        iframe.remove();
        processLinksSequentially(links, index + 1);
      }, 2000);
    }
  };

  document.body.appendChild(iframe);
}

function gatherDetailLinksAndStart() {
  const anchors = [...document.querySelectorAll(".Nv2PK a.hfpxzc")];
  const links = anchors.map((a) => a.href);
  console.log("🔗 Gizli detay linkleri alınan toplam işletme:", links.length);
  processLinksSequentially(links);
}

function startObserver() {
  const target = document.querySelector("div[role='feed']");
  if (!target) {
    console.log("⏳ Sol panel hâlâ yüklenmedi, tekrar denenecek...");
    setTimeout(startObserver, 1000);
    return;
  }

  let lastLinks = new Set();

  function checkForNewLinks() {
    const anchors = [...document.querySelectorAll(".Nv2PK a.hfpxzc")];
    const newLinks = anchors.map((a) => a.href).filter(Boolean);
    const uniqueNewLinks = newLinks.filter(link => !lastLinks.has(link));

    if (uniqueNewLinks.length > 0) {
      console.log(`📡 Yeni işletmeler algılandı (gözlem veya scroll): ${uniqueNewLinks.length}`);
      uniqueNewLinks.forEach(link => lastLinks.add(link));
      processLinksSequentially(uniqueNewLinks);
    } else {
      console.log("🔁 Yeni işletme bulunamadı.");
    }
  }

  const observer = new MutationObserver(() => {
    checkForNewLinks();
  });

  observer.observe(target, { childList: true, subtree: true });

  const map = document.querySelector("#scene");
  if (map) {
    map.addEventListener("mouseup", () => {
      setTimeout(checkForNewLinks, 2000);
    });
  }

  console.log("👁️ Liste paneli dinamik olarak ve scroll sonrası izleniyor.");
}


window.addEventListener("load", () => {
  chrome.storage.local.get("results", (data) => {
    storedResults = data.results || [];
    console.log("🔄 Önceki veriler yüklendi:", storedResults.length);

    setTimeout(() => {
      startObserver();
      gatherDetailLinksAndStart();
    }, 3000);
  });
});
