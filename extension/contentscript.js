'use strict';

function Player() {
  this.hostname = 'localhost';
  this.websocketUrl = 'ws://' + this.hostname + ':8080';
  this.serverUrl = 'http://localhost:3000';
  this.container = null;
  this.connection = null;
}

Player.prototype.getVideoContainers = function () {
  return document.querySelectorAll('video');
};

Player.prototype.getUniqueId = function () {
  return fetch(this.serverUrl + '/connection', {method: 'POST'})
    .then(response => response.text());
};

Player.prototype.setContainer = function (container) {
  console.log('Setting video container as', container);
  this.container = container;
};

Player.prototype.connect = function (id) {
  if (this.connection) {
    console.log('Connection already exists!');

    this.connection.close();
  }

  this.id = id;
  this.connection = new WebSocket(this.websocketUrl + '/' + this.id);

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
    this.send({
      type: 'PLAYING',
      time: this.container.currentTime
    });
  });

  this.container.addEventListener('play', () => {
    this.send({
      type: 'PLAY',
      time: this.container.currentTime
    });
  });

  this.container.addEventListener('pause', () => {
    this.send({
      type: 'PAUSE',
      time: this.container.currentTime
    });
  });

  this.container.addEventListener('error', () => {
    this.send({
      type: 'ERROR'
    });
  });

  this.container.addEventListener('ended', () => {
    this.send({
      type: 'ENDED'
    });
  });

  // this.container.addEventListener('timeupdate', () => {
  //   this.send({
  //     type: 'TIMEUPDATE',
  //     time: this.container.currentTime
  //   });
  // });
};

Player.prototype.send = function (message) {
  console.log('Sending message', message);

  if (!this.connection) {
    throw new Error('No connection found');
  }

  this.connection.send(JSON.stringify(message));
};

const player = new Player();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
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
    default:
      console.log('shef vse slomalos', request);
  }

  return true;
});

const containers = player.getVideoContainers();

console.log(containers.length + ' video tag(s) available for together playback');

if (containers.length) {
  player.setContainer(containers[0]);
}
