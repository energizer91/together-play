let port = null;

function getCurrentTab() {
  return new Promise(resolve => {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
      resolve(tabs[0]);
    });
  })
}

function createPort(tab) {
  port = chrome.tabs.connect(tab.id);

  return port;
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

  if (!port) {
    getCurrentTab()
      .then(tab => createPort(tab))
      .then(port => port.postMessage(message));

    return;
  }

  port.postMessage(message)
}

document.addEventListener('DOMContentLoaded', function () {
  const localhostCheck = document.getElementById('localhost');
  const containerField = document.getElementById('container-field');
  const findContainerButton = document.getElementById('find-container');
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
    sendMessage({type: 'getId'});
  });

  connectButton.addEventListener('click', () => {
    const id = setIdInput.value;

    if (!id) {
      setStatus('Please set valid id!');
    }

    sendMessage({type: 'connect', id: id})
  });

  findContainerButton.addEventListener('click', () => {
    sendMessage({type: 'findContainer'});
  });

  function connectPort() {
    getCurrentTab()
      .then(tab => createPort(tab))
      .then(port => {

        sendMessage({type: 'status'});

        port.onDisconnect.addListener(error => {
          console.log('port disconnect error lol kek', error);

          connectPort();
        });

        port.onMessage.addListener(message => {
          switch (message.type) {
            case 'setId':
              setHash(message.hash);
              sendMessage({type: 'connect', id: message.hash});
              break;
            case 'status':
              synchronizeStatus(message.status);
              break;
            case 'state':
              setStatus(message.state);
              break;
            default:
              console.log('unknown message', message);
          }
        })
      });
  }

  connectPort();
});
