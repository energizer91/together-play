'use strict';

function getVideoContainers(d = document) {
  if (!d) {
    return [];
  }

  return d.querySelectorAll('video');
}

let globalPort = null;

const slaveStatuses = ['play', 'playing', 'pause', 'seeked'];

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

    this.playing = false;
    this.playable = false;

    this.remotePlaying = false;
    this.remotePlayable = false;

    this.changeHost();

    this.onVideoEvent = this.onVideoEvent.bind(this);
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

  onVideoEvent(e) {
    this.setStatus(e.type);
  }

  removeContainer() {
    console.log('Removing container', this.container);

    this.setState('remove_container');

    this.container.removeEventListener('play', this.onVideoEvent);
    this.container.removeEventListener('playing', this.onVideoEvent);
    this.container.removeEventListener('pause', this.onVideoEvent);
    this.container.removeEventListener('waiting', this.onVideoEvent);
    this.container.removeEventListener('seeked', this.onVideoEvent);

    this.container = null;
  }

  setContainer(container) {
    if (this.container) {
      this.removeContainer();
    }

    console.log('Setting video container as', container);

    this.setState('set_container');
    this.container = container;

    this.container.addEventListener('play', this.onVideoEvent);
    this.container.addEventListener('playing', this.onVideoEvent);
    this.container.addEventListener('pause', this.onVideoEvent);
    this.container.addEventListener('waiting', this.onVideoEvent);
    this.container.addEventListener('canplaythrough', this.onVideoEvent);
    this.container.addEventListener('seeked', this.onVideoEvent);

    this.send({
      type: 'CONTAINER',
      container: this.container && this.container.currentSrc
    });

    this.setState('ready');
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
      this.setState('connected');
    });

    this.connection.addEventListener('close', (code, reason) => {
      console.log('websocket close', code, reason);
      this.setState('disconnected');

      if (code !== 4000) { // Session invalid
        this.reconnect();
      }
    });


    this.connection.addEventListener('error', error => {
      console.log('websocket error', error);
      this.setState('connection error');

      this.reconnect();
    });

    this.connection.addEventListener('message', (message) => {
      if (!this.container) {
        return;
      }

      const data = JSON.parse(message.data);

      switch (data.type) {
        case 'CONTAINER':
          console.log('Remote container', data.container);
          break;
        case 'PLAYING':
          this.setRemotePlaying(data.state, data.silent, data.time);
          break;
        case 'PLAYABLE':
          this.setRemotePlayable(data.state, data.time);
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

    this.connection.send(JSON.stringify(message));
  }

  setPlaying(playing = true) {
    if (this.playing === playing) {
      return;
    }

    let silent = false;

    if (this.remotePlaying === playing) {
      silent = true;
    }

    if (!this.remotePlayable && !playing) {
      silent = true;
    }

    this.playing = playing;

    this.send({
      type: 'PLAYING',
      state: playing,
      time: this.container.currentTime,
      silent
    });
  }

  setPlayable(playable = true) {
    if (this.playable === playable) {
      return;
    }

    this.playable = playable;

    this.send({
      type: 'PLAYABLE',
      state: playable,
      time: this.container.currentTime
    });
  }

  correctTime(time) {
    console.log('time mismatch');
    this.container.currentTime = time;
  }

  setRemotePlaying(remotePlaying = true, silent = false, time) {
    this.remotePlaying = remotePlaying;

    if (remotePlaying === this.playing) {
      return;
    }

    if (silent) {
      return;
    }

    if (remotePlaying && time && Math.abs(this.container.currentTime - time) >= 0.5) {
      this.correctTime(time);
    }

    if (remotePlaying) {
      this.container.play();
    } else {
      this.container.pause();
    }
  }

  setRemotePlayable(remotePlayable = true, time) {
    this.remotePlayable = remotePlayable;

    // if (remotePlayable === this.playable) {
    //   return;
    // }

    if (time && Math.abs(this.container.currentTime - time) >= 0.5) {
      this.correctTime(time);
    }

    if (!remotePlayable) {
      this.container.pause();
    } else {
      this.container.play();
    }
  }

  setStatus(status) {
    if (status === 'waiting') {
      this.setPlayable(false);
    }

    if (status === 'canplaythrough') {
      this.setPlayable(true);
    }

    if (status === 'pause') {
      this.setPlaying(false);
    }

    if (status === 'play') {
      this.setPlaying(true);
    }
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
        player.retries = 0;
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
