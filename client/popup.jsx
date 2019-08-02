import React, {Component} from 'react';
import {connect} from 'react-redux';
import {setStage, injectScript, connectPort} from './redux/actions';

import Main from './views/Main.jsx';
import Settings from './views/Settings.jsx';

import StatusBar from './components/StatusBar.jsx';

class Popup extends Component {
  reset = () => {
    this.props.setStage('start');
  };

  componentDidMount() {
    this.props.injectScript();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.scriptInjected !== this.props.scriptInjected && this.props.scriptInjected) {
      this.props.connectPort();
    }
  }

  renderStage() {
    const {stage} = this.props;

    switch (stage) {
      case 'start':
        return (
          <div className="main">
            <Main />
          </div>
        );
      case 'settings':
        return (
          <div className="main">
            <Settings />
            <div className="button-container">
              <button className="button" onClick={this.reset}>Back</button>
            </div>
          </div>
        );
    }
  }

  render() {
    return (
      <div>
        <StatusBar />
        {this.renderStage()}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  stage: state.stage,
  scriptInjected: state.scriptInjected,
  portConnected: state.portConnected
});

const mapDispatchToProps = {
  setStage,
  injectScript,
  connectPort
};

export default connect(mapStateToProps, mapDispatchToProps)(Popup);
