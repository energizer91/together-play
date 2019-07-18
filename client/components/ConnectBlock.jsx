import React, {PureComponent} from 'react';
import {connect} from 'react-redux';

import {portSendMessage as sendMessage, setStatus} from '../redux/actions';

class ConnectBlock extends PureComponent {
  state = {
    stage: 'start',
    friendId: ''
  };

  componentDidMount() {
    if (this.props.connected && this.props.id) {
      this.setState({stage: 'connected'});
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.connected !== this.props.connected) {
      if (this.props.connected) {
        this.setState({stage: 'connected'});
      } else {
        this.setState({stage: 'start'});
      }
    }
  }

  disconnect = () => {
    const {sendMessage} = this.props;

    this.setState({stage: 'start'});

    sendMessage({type: 'disconnect'});
  };

  getId = () => {
    const {sendMessage} = this.props;

    this.setState({stage: 'loading'});

    sendMessage({type: 'getId'});
  };

  connect = () => {
    const {setStatus, sendMessage} = this.props;
    const {friendId} = this.state;

    if (!friendId) {
      setStatus('Please set valid id!');
      return;
    }

    sendMessage({type: 'connect', id: friendId});
  };

  join = () => {
    this.setState({stage: 'join'});
  };

  reset = () => {
    this.setState({stage: 'start'});
  };

  changeFriendId = e => {
    this.setState({friendId: e.target.value});
  };

  renderStage() {
    const {id} = this.props;
    const {stage, friendId} = this.state;

    switch (stage) {
      case 'start':
        return (
          <div className="button-container">
            <button className="button" onClick={this.getId}>Create room</button>
            <button className="button" onClick={this.join}>Join room</button>
          </div>
        );
      case 'loading':
        return (
          <div>
            <p className="session">Loading</p>
          </div>
        );
      case 'connected':
        if (!id) {
          return (
            <div>
              <p className="session">No id found</p>
            </div>
          );
        }

        return (
          <div>
            <p className="session">{id}</p>
            <div className="button-container">
              <button className="button button_cancel" onClick={this.disconnect}>Disconnect</button>
            </div>
          </div>
        );
      case 'join':
        return (
          <div>
            <div>
              <input placeholder="Friend id" type="text" value={friendId} onChange={this.changeFriendId}/>
            </div>
            <div className="button-container">
              <button className="button" onClick={this.connect} disabled={!friendId}>Connect</button>
              <button className="button button_cancel" onClick={this.reset}>Back</button>
            </div>
          </div>
        )
    }
  }

  render() {
    return (
      <div>
        {this.renderStage()}
      </div>
    )
  }
}

const mapStateToProps = state => ({
  id: state.id,
  connected: state.connected
});

const mapDispatchToProps = {
  sendMessage,
  setStatus
};

export default connect(mapStateToProps, mapDispatchToProps)(ConnectBlock);
