import React, {PureComponent} from 'react';

export default class ConnectBlock extends PureComponent {
  state = {
    stage: 'start',
    friendId: ''
  };

  componentDidMount() {
    if (this.props.id) {
      this.setState({stage: 'connected'});
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.id !== this.props.id && this.props.id) {
      this.setState({stage: 'connected'});
    }
  }

  disconnect = () => {
    const {onSendMessage} = this.props;

    this.setState({stage: 'start'});

    onSendMessage({type: 'disconnect'});
  };

  getId = () => {
    const {onSendMessage} = this.props;

    this.setState({stage: 'loading'});

    onSendMessage({type: 'getId'});
  };

  connect = () => {
    const {onSetStatus, onSendMessage} = this.props;
    const {friendId} = this.state;

    if (!friendId) {
      onSetStatus('Please set valid id!');
      return;
    }

    onSendMessage({type: 'connect', id: friendId});
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
            <button onClick={this.getId}>Create room</button>
            <button onClick={this.join}>Join room</button>
          </div>
        );
      case 'loading':
        return (
          <div>loading</div>
        );
      case 'connected':
        if (!id) {
          return (
            <div>no id found</div>
          );
        }

        return (
          <div>
            <p>Connected to session: <span className="session">{id}</span></p>
            <div className="button-container">
              <button onClick={this.disconnect}>Disconnect</button>
            </div>
          </div>
        );
      case 'join':
        return (
          <div>
            <div>
              <input placeholder="Friend id" type="text" value={friendId} onChange={this.changeFriendId} />
            </div>
            <div className="button-container">
              <button onClick={this.connect} disabled={!friendId}>Connect</button>
              <button onClick={this.reset}>Back</button>
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
