chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (msg.action === "updateIcon") {
    if (msg.connected) {
      chrome.browserAction.setIcon({path: "images/icon-started.png", tabId: sender.tab.id});
    } else {
      chrome.browserAction.setIcon({path: "images/icon-stopped.png", tabId: sender.tab.id});
    }
  }

  if (msg.action === 'injected') {
    console.log('sender', sender);

    return;
  }

  if (msg.action === 'injectScript') {
    const tab = msg.tabId;

    if (!tab) {
      return;
    }

    chrome.tabs.insertCSS(tab, {
      file: 'style.css'
    });

    chrome.tabs.executeScript(tab, {
      file: 'contentscript.js',
      allFrames: true
    }, function (r) {
      sendResponse(true);
    });

    return true;
  }
});
