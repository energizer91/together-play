'use strict';

function getVideoContainers(d = document) {
  if (!d) {
    return [];
  }

  return Array.from(d.querySelectorAll('video'));
}

let globalPort = null;
let containers = [];
let containerIndex = 0;

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

    this.remoteContainer = '';
    this.remotePlaying = false;
    this.remotePlayable = false;

    this.pingInterval = null;

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
    });
  }

  changeHost(localhost = false) {
    if (this.connection) {
      this.disconnect();
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

  synchronize(data) {
    this.remoteContainer = data.container;
    this.remotePlaying = data.playing;
    this.remotePlayable = data.playable;

    if (this.container) {
      this.container.currentTime = data.time;
    }
  }

  sendInitialize() {
    this.send({
      type: 'INITIALIZE',
      container: this.container && this.container.currentSrc,
      playing: this.playing,
      playable: this.playable,
      time: this.container.currentTime
    });
  }

  setId(id) {
    this.id = id;

    if (!globalPort) {
      return;
    }

    globalPort.postMessage({
      type: 'setId',
      id
    });
  }

  disconnect() {
    if (this.connection) {
      this.connection.close();

      this.connection = null;
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    this.setState('disconnected');

    this.remoteContainer = '';
  }

  connect(id) {
    if (this.connection) {
      console.log('Connection already exists. Disconnecting');

      this.disconnect();
    }

    this.setState('connecting');
    this.id = id;
    this.connection = new WebSocket(this.websocketUrl + '/' + this.id);

    this.connection.addEventListener('open', () => {
      this.setId(id);
      this.setState('connected');

      this.pingInterval = setInterval(() => {
        this.send({type: 'PING'});
      }, 10000);

      this.sendInitialize();

      if (!this.remoteContainer) {
        this.send({
          type: 'ASK_INITIALIZE'
        });
      }
    });

    this.connection.addEventListener('close', (e) => {
      console.log('websocket close', e.code, e.reason);

      if (e.code === 4000) { // Session invalid
        this.setState('session_invalid');
        this.setId('');
        this.disconnect();
      } else {
        this.reconnect();
      }
    });


    this.connection.addEventListener('error', error => {
      this.setId('');
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
        case 'PING':
          this.send({type: 'PONG'});
          break;
        case 'PONG':
          break;
        case 'ASK_INITIALIZE':
          this.sendInitialize();
          break;
        case 'INITIALIZE':
          console.log('synchronize players', data);
          this.synchronize(data);
          break;
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
  containers = getVideoContainers();
  containerIndex = containers.length - 1;

  console.log(containers.length + ' video tag(s) available for together playback');

  if (containers.length) {
    createPlayer(containerIndex);
  }
}

function createPlayer(index) {
  player = new Player();
  player.setContainer(containers[index]);
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

    if (message.type === 'pick_container') {
      if (message.frame !== location.href) {
        return;
      }

      console.log('picking container', containers[message.index]);
      containers[message.index].classList.remove('together-play__preselected');
      createPlayer(message.index);

      return;
    }

    if (!player) {
      return;
    }

    console.log('Incoming message', message);

    switch (message.type) {
      case 'get_containers':
        port.postMessage({
          type: 'containers',
          containers: containers.map(container => ({
            frame: location.href,
            container: container.currentSrc
          }))
        });
        break;
      case 'select_container':
        if (message.frame !== location.href) {
          break;
        }

        containers[message.index].classList.add('together-play__preselected');
        break;
      case 'deselect_container':
        if (message.frame !== location.href) {
          break;
        }

        containers[message.index].classList.remove('together-play__preselected');
        break;
      case 'getId':
        player.getUniqueId()
          .then(id => {
            console.log('Responding with id', id);

            port.postMessage({type: 'setId', id, connect: !player.connection});
          });
        break;
      case 'connect':
        player.retries = 0;
        player.connect(message.id);
        break;
      case 'disconnect':
        player.disconnect();
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
