import React, {Component} from 'react';

import ConnectBlock from './components/ConnectBlock.jsx';

class Popup extends Component {
  state = {
    port: null,
    id: '',
    state: 'idle',
    container: '',
    localhost: false,
    containers: [],
    stage: 'start',
    connected: false
  };

  componentDidMount() {
    this.connectPort();
  }

  connectPort() {
    chrome.tabs.query({active: true, currentWindow: true}, tabs => {
      const port = chrome.tabs.connect(tabs[0].id);

      this.setState({port});

      port.postMessage({type: 'status'});

      port.onMessage.addListener(message => {
        switch (message.type) {
          case 'containers':
            this.setState({containers: message.containers});
            break;
          case 'setId':
            this.setId(message.id);

            if (message.id && message.connect) {
              port.postMessage({type: 'connect', id: message.id});
            }
            break;
          case 'status':
            this.synchronizeStatus(message.status);
            break;
          case 'state':
            this.setStatus(message.state);
            break;
          default:
            console.log('unknown message', message);
        }
      });
    });
  }

  changeLocalhost = e => {
    this.setState({
      localhost: e.target.checked
    });
  };

  setStatus(state) {
    this.setState({
      state
    });
  }

  setId(id) {
    this.setState({
      id
    });
  }

  setStage(stage) {
    this.setState({
      stage
    });
  }

  synchronizeStatus(status) {
    console.log('Synchronizing status', status);

    if (!status) {
      return;
    }

    this.setState({
      id: status.id,
      container: status.container,
      state: status.state,
      localhost: status.localhost
    });
  }

  play = () => {
    this.state.port.postMessage({type: 'play'});
  };

  pause = () => {
    this.state.port.postMessage({type: 'pause'});
  };

  findContainer = () => {
    this.state.port.postMessage({type: 'get_containers'});
  };

  selectContainer(index, frame) {
    this.state.port.postMessage({type: 'select_container', index, frame});
  }

  deselectContainer(index, frame) {
    this.state.port.postMessage({type: 'deselect_container', index, frame});
  }

  pickContainer(index, frame) {
    this.state.port.postMessage({type: 'pick_container', index, frame});

    this.setState({containers: [], container: this.state.containers[index].container});
  }

  openSettings = () => {
    if (this.state.stage === 'settings') {
      this.setState({stage: 'start'});
    } else {
      this.setState({stage: 'settings'});
    }
  };

  reset = () => {
    this.setState({stage: 'start'});
  };

  renderContainer() {
    const {container, containers} = this.state;

    if (containers.length) {
      console.log('selecting containers', containers);
      return (
        <ul className="container-select">
          {containers.map((c, i) => (
            <li
              key={i}
              onMouseEnter={() => this.selectContainer(i, c.frame)}
              onMouseLeave={() => this.deselectContainer(i, c.frame)}
              onClick={() => this.pickContainer(i, c.frame)}
              className="video-caption"
            >
              {c.container}
            </li>
          ))}
        </ul>
      )
    }

    if (!container) {
      return (
        <div>
          <p>No container attached</p>
          <button onClick={this.findContainer}>change container</button>
        </div>
      )
    }

    return (
      <div>
        <div className="button-container">
          <button onClick={this.play}>play</button>
          <button onClick={this.pause}>pause</button>
        </div>
        <p className="video-caption">{container}</p>
        <div className="button-container" style={{marginBottom: 10}}>
          <button onClick={this.findContainer}>change container</button>
        </div>
      </div>
    )
  }

  renderStage() {
    const {stage, id} = this.state;

    switch (stage) {
      case 'loading':
        return (
          <div>loading</div>
        );
      case 'start':
        return (
          <div>
            <ConnectBlock
              id={id}
              onSetStatus={status => this.setStatus(status)}
              onSendMessage={message => this.state.port.postMessage(message)}
            />
          </div>
        );
      case 'settings':
        return (
          <div>
            {this.renderContainer()}
            <div className="button-container">
              <button onClick={this.reset}>Back</button>
            </div>
          </div>
        );
    }
  }

  render() {
    const {state, port} = this.state;

    if (!port) {
      return (
        <div>Connecting to port...</div>
      );
    }

    return (
      <div>
        <div className="statusbar">
          <p className="statusbar__status">{state}</p>
          <p className="statusbar__settings" onClick={this.openSettings}><img src="images/settings.png" alt="settings"/></p>
        </div>
        {this.renderStage()}
      </div>
    );
  }
}

export default Popup;
