document.addEventListener("DOMContentLoaded", () => {
  console.log("🔧 DOM loaded");

  const resetBtn = document.getElementById("resetData");
  const hardResetBtn = document.getElementById("hardResetData");
  const exportXlsxBtn = document.getElementById("exportXlsx");
  const countBox = document.getElementById("count");
  const storedDataBox = document.getElementById("storedData");

  const texts = {
    totalLabel: "Collected Business Count:",
    exportXlsx: "📥 Export to Excel",
    resetData: "🗑️ Reset Data",
    hardResetData: "🔧 Troubleshoot",
    storageDataLabel: "Stored Data:",
    noData: "No data available. Ensure businesses are visible on the map.",
    dataReset: "Data has been reset!",
    pageReloading: "Page is reloading..."
  };

  document.getElementById("totalLabel").textContent = texts.totalLabel;
  document.getElementById("exportXlsx").textContent = texts.exportXlsx;
  document.getElementById("resetData").textContent = texts.resetData;
  document.getElementById("hardResetData").textContent = texts.hardResetData;
  document.getElementById("storageDataLabel").textContent = texts.storageDataLabel;

  function updateStorageDisplay() {
    chrome.storage.local.get("results", (data) => {
      const results = Array.isArray(data.results) ? data.results : [];
      const count = results.length;
      countBox.textContent = count.toString();
      resetBtn.disabled = count === 0;
      storedDataBox.value = count > 0 ? JSON.stringify(results, null, 2) : "";
    });
  }

  exportXlsxBtn.addEventListener("click", () => {
    chrome.runtime.sendMessage("getResults", (data) => {
      if (!data || !Array.isArray(data) || data.length === 0) {
        alert(texts.noData);
        return;
      }

      let table = "<table><tr>";
      const headers = Object.keys(data[0]);
      headers.forEach(header => {
        table += `<th>${header}</th>`;
      });
      table += "</tr>";

      data.forEach(row => {
        table += "<tr>";
        headers.forEach(field => {
          table += `<td>${row[field] || ""}</td>`;
        });
        table += "</tr>";
      });

      table += "</table>";

      const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:x="urn:schemas-microsoft-com:office:excel"
            xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="UTF-8">
          <style>
            table, th, td {
              border: 1px solid black;
              border-collapse: collapse;
            }
            th, td {
              padding: 5px;
              text-align: left;
            }
          </style>
        </head>
        <body>${table}</body>
      </html>
      `;

      const blob = new Blob([html], { type: "application/vnd.ms-excel" });
      const url = URL.createObjectURL(blob);

      chrome.downloads.download({
        url,
        filename: "maps-results.xls",
        saveAs: true
      });
    });
  });

  resetBtn.addEventListener("click", () => {
    chrome.storage.local.remove("results", () => {
      chrome.runtime.sendMessage({ type: "UPDATE_BADGE", count: 0 }, () => {
        console.log("📛 Badge cleared");
      });
      alert(texts.dataReset);
      updateStorageDisplay();
    });
  });

  hardResetBtn.addEventListener("click", () => {
    chrome.storage.local.remove("results", () => {
      chrome.runtime.sendMessage({ type: "UPDATE_BADGE", count: 0 }, () => {
        console.log("📛 Badge cleared (hard)");
      });
      alert(texts.pageReloading);
      updateStorageDisplay();
      setTimeout(() => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          chrome.tabs.reload(tabs[0].id);
        });
      }, 500);
    });
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.results) {
      updateStorageDisplay();
    }
  });

  updateStorageDisplay();
});
