'use strict';

function getVideoContainers() {
  return Array.from(document.querySelectorAll('video'));
}

function getContainerName(container) {
  return container && (container.currentSrc || container.className);
}

let containers = [];
let containerIndex = 0;

function setIcon(connected = false) {
  chrome.runtime.sendMessage({
    action: 'updateIcon',
    connected
  });
}

class Player {
  constructor() {
    this.localhost = false;
    this.state = 'initialize';
    this.id = '';
    this.websocketUrl = 'wss://together-play.herokuapp.com';
    this.serverUrl = 'https://together-play.herokuapp.com';
    this.container = null;
    this.connection = null;
    this.retries = 0;
    this.connected = false;

    this.playing = false;
    this.playable = false;

    this.remoteContainer = '';
    this.remotePlaying = false;
    this.remotePlayable = false;

    this.pingInterval = null;

    // callbacks
    this.onconnect = null;
    this.ondisconnect = null;
    this.onchangeId = null;
    this.onchangeState = null;

    this.onVideoEvent = this.onVideoEvent.bind(this);
  }

  getUniqueId() {
    return fetch(this.serverUrl + '/connection', {method: 'POST'})
      .then(response => response.text())
      .then(hash => {
        this.id = hash;
        return hash;
      })
      .catch(error => {
        console.error('Getting unique id failed', error);
        this.setState('error');
      })
  }

  onVideoEvent(e) {
    this.setStatus(e.type);
  }

  removeContainer() {
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

    this.container = container;

    this.container.addEventListener('play', this.onVideoEvent);
    this.container.addEventListener('playing', this.onVideoEvent);
    this.container.addEventListener('pause', this.onVideoEvent);
    this.container.addEventListener('waiting', this.onVideoEvent);
    this.container.addEventListener('canplaythrough', this.onVideoEvent);
    this.container.addEventListener('seeked', this.onVideoEvent);

    this.setState('ready');
  }

  reconnect() {
    this.retries++;
    setIcon(false);

    if (this.retries > 5) {
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
      container: getContainerName(this.container),
      playing: this.playing,
      playable: this.playable,
      time: this.container.currentTime
    });
  }

  setState(state) {
    this.state = state;

    if (this.onchangeState && typeof this.onchangeState === 'function') {
      this.onchangeState(state);
    }
  }

  setId(id) {
    this.id = id;

    if (this.onchangeId && typeof this.onchangeId === 'function') {
      this.onchangeId(id);
    }
  }

  setConnected() {
    this.connected = true;

    if (this.onconnect && typeof this.onconnect === 'function') {
      this.onconnect();
    }
  }

  setDisconnected() {
    this.connected = false;

    if (this.ondisconnect && typeof this.ondisconnect === 'function') {
      this.ondisconnect();
    }
  }

  resetEvents() {
    this.onchangeId = null;
    this.onchangeState = null;
    this.onconnect = null;
    this.ondisconnect = null;
  }

  disconnect() {
    if (this.connection) {
      this.connection.close();

      this.connection = null;
      clearInterval(this.pingInterval);
      this.pingInterval = null;
      this.setDisconnected();
    }

    this.setState('disconnected');

    setIcon(false);

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
      this.setConnected();
      setIcon(true);

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
        this.setId('');
        this.disconnect();
      } else if (e.code === 1006) {
        this.reconnect();
      }
    });


    this.connection.addEventListener('error', error => {
      this.setId('');
      console.log('websocket error', error);
      this.setState('error');
      this.setDisconnected();

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
          this.synchronize(data);
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

  if (containers.length) {
    console.log('Found ' + containers.length + ' video tag(s) available for together playback');
    player = new Player();

    changeContainer(containerIndex);
  }
}

function changeContainer(index) {
  if (!player) {
    return;
  }

  player.setContainer(containers[index]);
}

chrome.runtime.onConnect.addListener(port => {
  if (player) {
    player.onconnect = () => port.postMessage({type: 'connected', connected: true});
    player.ondisconnect = () => port.postMessage({type: 'connected', connected: false});
    player.onchangeId = id => port.postMessage({type: 'setId', id});
    player.onchangeState = state => port.postMessage({type: 'state', state});
  }

  port.onDisconnect.addListener(() => {
    if (player) {
      player.resetEvents();
    }
  });

  port.onMessage.addListener(message => {
    if (message.type === 'pick_container') {
      if (message.frame !== location.href) {
        return;
      }

      containers[message.index].classList.remove('together-play__preselected');

      if (!player) {
        player = new Player();
      }

      changeContainer(message.index);

      return;
    }

    if (!player) {
      return;
    }

    switch (message.type) {
      case 'get_containers':
        containers = getVideoContainers();

        port.postMessage({
          type: 'containers',
          containers: containers.map(container => ({
            frame: location.href,
            container: getContainerName(container)
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
          .then(id => port.postMessage({type: 'setId', id, connect: !player.connection}));
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
            connected: player.connected,
            id: player.id,
            localhost: player.localhost
          }
        });
        break;
      default:
        console.log('shef vse slomalos', message);
    }
  });
});

initialize();
