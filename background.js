chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "UPDATE_BADGE") {
    chrome.action.setBadgeText({ text: message.count.toString() });
    chrome.action.setBadgeBackgroundColor({ color: "#4285F4" });
  }

  if (message === "getResults") {
    chrome.storage.local.get("results", data => {
      sendResponse(data.results || []);
    });
    return true;
  }
});
