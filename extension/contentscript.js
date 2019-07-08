'use strict';

function getVideoContainers(d = document) {
  if (!d) {
    return [];
  }

  return d.querySelectorAll('video');
}

class Player {
  constructor() {
    this.localhost = false;
    this.state = 'idle';
    this.id = '';
    this.websocketUrl = '';
    this.serverUrl = '';
    this.container = null;
    this.connection = null;

    this.changeHost();
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
    this.state = 'get_unique_id';
    return fetch(this.serverUrl + '/connection', {method: 'POST'})
      .then(response => response.text())
      .then(hash => {
        this.state = 'get_unique_id_successful';
        this.id = hash;
        return hash;
      })
      .catch(error => {
        console.error('Getting unique id failed', error);
        this.state = 'get_unique_id_failed';
      })
  }

  setContainer(container) {
    console.log('Setting video container as', container);
    this.state = 'set_container';
    this.container = container;
  }

  connect(id) {
    if (this.connection) {
      console.log('Connection already exists!');

      this.connection.close();
    }

    this.state = 'connecting';
    this.id = id;
    this.connection = new WebSocket(this.websocketUrl + '/' + this.id);

    this.connection.addEventListener('open', () => {
      this.state = 'connected';
    });

    this.connection.addEventListener('close', () => {
      this.state = 'disconnected';
    });

    this.connection.addEventListener('message', (message) => {
      console.log('Got message', message);

      if (!this.container) {
        return;
      }

      const data = JSON.parse(message.data);

      switch(data.type) {
        case 'PLAY':
          this.container.currentTime = data.time;
          this.container.play();
          break;
        // case 'PLAYING':
        //   this.container.currentTime = data.time;
        //   break;
        case 'PAUSE':
          this.container.currentTime = data.time;
          this.container.pause();
          break;
      }
    });

    if (!this.container) {
      return;
    }

    this.container.addEventListener('playing', () => {
      console.log('event playing');
      this.send({
        type: 'PLAYING',
        time: this.container.currentTime
      });
    });

    this.container.addEventListener('play', () => {
      console.log('event play');
      this.send({
        type: 'PLAY',
        time: this.container.currentTime
      });
    });

    this.container.addEventListener('pause', () => {
      console.log('event pause');
      this.send({
        type: 'PAUSE',
        time: this.container.currentTime
      });
    });

    this.container.addEventListener('error', () => {
      console.log('event error');
      this.send({
        type: 'ERROR'
      });
    });

    this.container.addEventListener('ended', () => {
      console.log('event ended');
      this.send({
        type: 'ENDED'
      });
    });

    this.container.addEventListener('timeupdate', () => {
      console.log('event timeupdate');
      // this.send({
      //   type: 'TIMEUPDATE',
      //   time: this.container.currentTime
      // });
    });

    this.container.addEventListener('canplaythrough', () => {
      console.log('event canplaythrough');
      // this.send({
      //   type: 'CANPLAYTHROUGH',
      //   time: this.container.currentTime
      // });
    });

    this.container.addEventListener('waiting', () => {
      console.log('event waiting');
      // this.send({
      //   type: 'WAITING',
      //   time: this.container.currentTime
      // });
    });

    this.container.addEventListener('volumechange', () => {
      console.log('event volumechange');
      // this.send({
      //   type: 'VOLUMECHANGE',
      //   time: this.container.currentTime
      // });
    });

    this.container.addEventListener('progress', () => {
      console.log('event progress');
      // this.send({
      //   type: 'PROGRESS',
      //   time: this.container.currentTime
      // });
    });

    this.container.addEventListener('loadstart', () => {
      console.log('event loadstart');
      // this.send({
      //   type: 'LOADSTART',
      //   time: this.container.currentTime
      // });
    });

    this.container.addEventListener('loadeddata', () => {
      console.log('event loadeddata');
      // this.send({
      //   type: 'LOADEDDATA',
      //   time: this.container.currentTime
      // });
    });

    this.container.addEventListener('abort', () => {
      console.log('event abort');
      // this.send({
      //   type: 'ABORT',
      //   time: this.container.currentTime
      // });
    });
  }

  send(message) {
    console.log('Sending message', message);

    if (!this.connection) {
      throw new Error('No connection found');
    }

    this.connection.send(JSON.stringify(message));
  }
}

let player = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (!player) {
    return;
  }

  console.log('Incoming message', request);

  switch(request.type) {
    case 'getId':
      player.getUniqueId()
        .then(hash => {
          console.log('Responding with hash', hash);
          sendResponse(hash);
        });

      break;
    case 'connect':
      player.connect(request.id);
      break;
    case 'play':
      player.container.play();
      break;
    case 'pause':
      player.container.pause();
      break;
    case 'status':
      sendResponse({
        state: player.state,
        container: player.container && player.container.currentSrc,
        id: player.id,
        localhost: player.localhost
      });
      break;
    case 'change_host':
      player.changeHost(request.localhost);
      break;
    default:
      console.log('shef vse slomalos', request);
  }

  return true;
});

const containers = getVideoContainers();

console.log(containers.length + ' video tag(s) available for together playback');

if (containers.length) {
  player = new Player();
  player.setContainer(containers[0]);
}
