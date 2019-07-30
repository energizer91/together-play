import React from 'react';
import {connect} from 'react-redux';
import {toggleSettings} from '../redux/actions';
import ConnectBlock from '../components/ConnectBlock.jsx';

const Main = ({portConnected, container, toggleSettings}) => {
  if (!portConnected) {
    return (
      <p>Connecting to port...</p>
    );
  }

  if (!container) {
    return (
      <div>
        <p>No video attached</p>
        <div className="button-container">
          <button className="button" onClick={toggleSettings}>Go to settings</button>
        </div>
      </div>
    )
  }

  return <ConnectBlock />;
};

const mapStateToProps = state => ({
  portConnected: state.portConnected,
  container: state.container
});

const mapDispatchToProps = {
  toggleSettings
};

export default connect(mapStateToProps, mapDispatchToProps)(Main);
