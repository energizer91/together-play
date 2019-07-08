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
  const localhostCheck = document.getElementById('localhost');
  const containerField = document.getElementById('container-field');
  const playButton = document.getElementById('play-button');
  const pauseButton = document.getElementById('pause-button');
  const idLabel = document.getElementById('id-label');
  const status = document.getElementById('status');
  const getIdButton = document.getElementById('get-id-button');
  const setIdInput = document.getElementById('set-id');
  const connectButton = document.getElementById('connect-button');

  function setStatus(text) {
    status.textContent = text;
  }

  function setHash(hash) {
    idLabel.textContent = 'Session: ' + hash;
  }

  function synchronizeStatus(status) {
    if (!status) {
      return;
    }

    if (status.container) {
      containerField.textContent = status.container;
    }

    if (status.id) {
      setHash(status.id);
    }

    if (status.state) {
      setStatus(status.state);
    }

    localhostCheck.checked = status.localhost;
  }

  localhostCheck.addEventListener('change', e => {
    sendMessage({type: 'change_host', localhost: e.target.checked});
  });

  playButton.addEventListener('click', () => {
    sendMessage({type: 'play'});
  });

  pauseButton.addEventListener('click', () => {
    sendMessage({type: 'pause'});
  });

  getIdButton.addEventListener('click', () => {
    setStatus('Getting new session id');

    sendMessage({type: 'getId'})
      .then(response => {
        setHash(response)
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

  sendMessage({type: 'status'})
    .then(status => synchronizeStatus(status));
});
