chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (msg.action === "updateIcon") {
    if (msg.connected) {
      chrome.browserAction.setIcon({path: "images/icon-started.png", tabId: sender.tab.id});
    } else {
      chrome.browserAction.setIcon({path: "images/icon-stopped.png", tabId: sender.tab.id});
    }
  }
});
