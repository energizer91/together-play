function getCurrentTab() {
  return new Promise(resolve => {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
      resolve(tabs[0]);
    });
  })
}

function sendMessageToTab(tab, message) {
  return new Promise(resolve => {
    chrome.tabs.sendMessage(tab, message, function (response) {
      console.log('Popup: Receiving message', response);
      resolve(response);
    });
  })
}

function sendMessage(message) {
  console.log('Popup: Sending message', message);
  return getCurrentTab()
    .then(tab => sendMessageToTab(tab.id, message));
}

document.addEventListener('DOMContentLoaded', function () {
  const idLabel = document.getElementById('id-label');
  const status = document.getElementById('status');
  const getIdButton = document.getElementById('get-id-button');
  const setIdInput = document.getElementById('set-id');
  const connectButton = document.getElementById('connect-button');

  function setStatus(text) {
    status.textContent = text;
  }

  getIdButton.addEventListener('click', () => {
    setStatus('Getting new session id');

    sendMessage({type: 'getId'})
      .then(response => {
        setStatus('New session: ' + response);
        idLabel.textContent = 'Session: ' + response;
      });
  });

  connectButton.addEventListener('click', () => {
    setStatus('Start connecting to ws server');

    const id = setIdInput.value;

    if (!id) {
      setStatus('Please set valid id!');
    }

    sendMessage({type: 'connect', id: id})
      .then(response => {
        setStatus('Connection complete: ' + response);
      });
  });
});
