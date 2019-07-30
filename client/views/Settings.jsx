import React, {Component} from 'react';
import {connect} from 'react-redux';
import {setStage, portSendMessage as sendMessage, setContainer} from '../redux/actions';

class Settings extends Component {
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

  render() {
    const {containers, container} = this.props;

    if (containers.length) {
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
          <p>No video containers found</p>
          <div className="button-container" style={{marginBottom: 10}}>
            <button className="button" onClick={this.findContainer}>Change container</button>
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
}

const mapStateToProps = state => ({
  container: state.container,
  containers: state.containers
});

const mapDispatchToProps = {
  setContainer,
  setStage,
  sendMessage
};

export default connect(mapStateToProps, mapDispatchToProps)(Settings);
