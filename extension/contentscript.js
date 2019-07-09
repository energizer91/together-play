'use strict';

function getVideoContainers(d = document) {
  if (!d) {
    return [];
  }

  return d.querySelectorAll('video');
}

let globalPort = null;

class Player {
  constructor() {
    this.localhost = false;
    this.state = 'idle';
    this.id = '';
    this.websocketUrl = '';
    this.serverUrl = '';
    this.container = null;
    this.connection = null;
    this.retries = 0;
    this.waiting = false;
    this.remoteStatus = '';
    this.status = '';

    this.changeHost();
  }

  setState(state) {
    this.state = state;

    if (!globalPort) {
      return;
    }

    globalPort.postMessage({
      type: 'state',
      state: state
    })
  }

  changeHost(localhost = false) {
    if (this.connection) {
      this.connection.close();
      this.connection = null;
    }

    this.localhost = localhost;

    if (this.localhost) {
      this.websocketUrl = 'ws://localhost:3000';
      this.serverUrl = 'http://localhost:3000';
    } else {
      this.websocketUrl = 'wss://together-play.herokuapp.com';
      this.serverUrl = 'https://together-play.herokuapp.com';
    }
  }

  getUniqueId() {
    this.setState('get_unique_id');
    return fetch(this.serverUrl + '/connection', {method: 'POST'})
      .then(response => response.text())
      .then(hash => {
        this.setState('get_unique_id_successful');
        this.id = hash;
        return hash;
      })
      .catch(error => {
        console.error('Getting unique id failed', error);
        this.setState('get_unique_id_failed');
      })
  }

  setContainer(container) {
    console.log('Setting video container as', container);
    this.setState('set_container');
    this.container = container;

    this.container.onplaying = () => {
      this.setStatus('playing');
    };

    this.container.onplay = () => {
      this.setStatus('play');
    };

    this.container.onpause = () => {
      this.setStatus('pause');
    };

    this.container.onerror = () => {
      // this.setStatus('error');
    };

    this.container.onended = () => {
      // this.setStatus('ended');
    };

    this.container.ontimeupdate = () => {
      // this.setStatus('timeupdate', true);
    };

    this.container.oncanplaythrough = () => {
      // this.setStatus('canplaythrough', true);
    };

    this.container.onwaiting = () => {
      this.setStatus('waiting');
    };

    this.container.onseeking = () => {
      // this.setStatus('onseeking');
    };

    this.container.onseeked = () => {
      // this.setStatus('onseeked');
    };

    this.container.onvolumechange = () => {
      // this.setStatus('volumechange', true);
    };

    this.container.onprogress = () => {
      // this.setStatus('progress', true);
    };

    this.container.onloadstart = () => {
      // this.setStatus('loadstart');
    };

    this.container.onloadeddata = () => {
      // this.setStatus('loadeddata');
    };

    this.container.onabort = () => {
      // this.setStatus('abort');
    };
  }

  reconnect() {
    this.retries++;

    if (this.retries > 5) {
      // setTimeout(() => this.connect(this.id));
      throw new Error('Too many retries');
    }

    this.connect(this.id);
  }

  connect(id) {
    if (this.connection) {
      console.log('Connection already exists!');

      this.connection.close();
    }

    this.setState('connecting');
    this.id = id;
    this.connection = new WebSocket(this.websocketUrl + '/' + this.id);

    this.connection.addEventListener('open', () => {
      this.retries = 0;
      this.setState('connected');
    });

    this.connection.addEventListener('close', (code, reason) => {
      console.log('websocket close', code, reason);
      this.setState('disconnected');

      this.reconnect();
    });


    this.connection.addEventListener('error', error => {
      console.log('websocket error', error);
      this.setState('disconnected');

      this.reconnect();
    });

    this.connection.addEventListener('message', (message) => {
      // console.log('Got message', message);

      if (!this.container) {
        return;
      }

      const data = JSON.parse(message.data);

      switch (data.type) {
        case 'STATUS':
          this.setRemoteStatus(data.status, data);
          break;
        default:
          console.log('Unknown message type', message);
      }
    });
  }

  send(message) {
    if (!this.connection) {
      return;
    }

    // console.log('Sending message', message);

    this.connection.send(JSON.stringify(message));
  }


  setStatus(status, skipSend = false) {
    let slave;

    if (this.remoteStatus === status && (status === 'play' || status === 'pause' || status === 'playing')) {
      console.log('slave looool');
      slave = true;
    }

    this.status = status;

    if (!skipSend) {
      this.send({
        type: 'STATUS',
        status: status,
        time: this.container.currentTime,
        silent: slave
      });
    }
  }

  setRemoteStatus(newRemoteStatus, data) {
    const previousRemoteStatus = this.remoteStatus;

    if (data.silent) {
      console.log('silently update remote status');
      this.remoteStatus = newRemoteStatus;
      return;
    }

    switch (newRemoteStatus) {
      case 'play':
        if (this.status === 'pause') {
          if (Math.abs(this.container.currentTime - data.time) >= 0.5) {
            console.log('time mismatch');
            this.container.currentTime = data.time;
          }
        }
        this.container.play();
        break;
      case 'playing':
        if (previousRemoteStatus === 'playing') {
          console.log('attempt to play when already playing');
          break;
        }

        if (previousRemoteStatus === 'waiting') {
          this.container.currentTime = data.time;
          break;
        }
        break;
      case 'pause':
        this.container.pause();
        break;
      case 'waiting':
        console.log('i need to wait');
        break;
      default:
        console.log('hz chto delat', newRemoteStatus);
    }

    this.remoteStatus = newRemoteStatus;
  }
}

let player = null;

function initialize() {
  const containers = getVideoContainers();

  console.log(containers.length + ' video tag(s) available for together playback');

  if (containers.length) {
    player = new Player();
    player.setContainer(containers[containers.length - 1]);
  }
}

chrome.runtime.onConnect.addListener(function (port) {
  globalPort = port;

  port.onDisconnect.addListener(function () {
    globalPort = null;
  });

  port.onMessage.addListener(message => {
    if (message.type === 'findContainer') {
      console.log('finding new container');
      initialize();

      return;
    }

    if (!player) {
      return;
    }

    console.log('Incoming message', message);

    switch (message.type) {
      case 'getId':
        player.getUniqueId()
          .then(hash => {
            console.log('Responding with hash', hash);

            port.postMessage({type: 'setId', hash: hash});
          });
        break;
      case 'connect':
        player.connect(message.id);
        break;
      case 'play':
        player.container.play();
        break;
      case 'pause':
        player.container.pause();
        break;
      case 'status':
        port.postMessage({
          type: 'status',
          status: {
            state: player.state,
            container: player.container && player.container.currentSrc,
            id: player.id,
            localhost: player.localhost
          }
        });
        break;
      case 'change_host':
        player.changeHost(message.localhost);
        break;
      default:
        console.log('shef vse slomalos', message);
    }
  });
});

initialize();
