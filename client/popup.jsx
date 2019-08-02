import React, {Component} from 'react';
import {connect} from 'react-redux';
import {setStage, connectPort} from './redux/actions';

import Main from './views/Main.jsx';
import Settings from './views/Settings.jsx';

import StatusBar from './components/StatusBar.jsx';

class Popup extends Component {
  componentDidMount() {
    this.props.connectPort();
  }

  reset = () => {
    this.props.setStage('start');
  };

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
  portConnected: state.portConnected
});

const mapDispatchToProps = {
  setStage,
  connectPort
};

export default connect(mapStateToProps, mapDispatchToProps)(Popup);
