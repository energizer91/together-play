import React, {Component} from 'react';
import {connect} from 'react-redux';
import {portSendMessage as sendMessage, setContainer} from './redux/actions';

import ConnectBlock from './components/ConnectBlock.jsx';
import StatusBar from './components/StatusBar.jsx';

class Popup extends Component {
  state = {
    stage: 'start'
  };

  play = () => {
    this.props.sendMessage({type: 'play'});
  };

  pause = () => {
    this.props.sendMessage({type: 'pause'});
  };

  findContainer = () => {
    this.props.sendMessage({type: 'get_containers'});
  };

  selectContainer(index, frame) {
    this.props.sendMessage({type: 'select_container', index, frame});
  }

  deselectContainer(index, frame) {
    this.props.sendMessage({type: 'deselect_container', index, frame});
  }

  pickContainer(index, frame) {
    this.props.sendMessage({type: 'pick_container', index, frame});

    this.props.setContainer(index);
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
    const {container, containers} = this.props;

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
          <div className="button-container" style={{marginBottom: 10}}>
            <button className="button" onClick={this.findContainer}>change container</button>
          </div>
        </div>
      )
    }

    return (
      <div>
        <div className="button-container">
          <button className="button" onClick={this.play}>play</button>
          <button className="button" onClick={this.pause}>pause</button>
        </div>
        <p className="video-caption">{container}</p>
        <div className="button-container" style={{marginBottom: 10}}>
          <button className="button" onClick={this.findContainer}>change container</button>
        </div>
      </div>
    )
  }

  renderStage() {
    const {stage} = this.state;

    switch (stage) {
      case 'start':
        return (
          <div className="main">
            <ConnectBlock />
          </div>
        );
      case 'settings':
        return (
          <div className="main">
            {this.renderContainer()}
            <div className="button-container">
              <button className="button" onClick={this.reset}>Back</button>
            </div>
          </div>
        );
    }
  }

  render() {
    const {portConnected} = this.props;

    if (!portConnected) {
      return (
        <div>Connecting to port...</div>
      );
    }

    return (
      <div>
        <StatusBar onOpenSettings={this.openSettings} />
        {this.renderStage()}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  portConnected: state.portConnected,
  containers: state.containers,
  container: state.container,
  id: state.id
});

const mapDispatchToProps = {
  setContainer,
  sendMessage
};

export default connect(mapStateToProps, mapDispatchToProps)(Popup);
