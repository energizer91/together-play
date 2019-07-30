import React from 'react';
import {connect} from 'react-redux';
import {toggleSettings} from '../redux/actions';
import t from '../util/dictionary';

const StatusBar = ({state, connected, toggleSettings}) => (
  <div className="statusbar">
    <img className="statusbar__settings" src="images/logo.svg" alt="logo" onClick={toggleSettings}/>
    <p className={`statusbar__status${connected ? ' statusbar__status_connected' : ''}`}>{t(state)}</p>
    <img className="statusbar__settings" src="images/settings.png" alt="settings" onClick={toggleSettings}/>
  </div>
);

const mapStateToProps = state => ({
  state: state.state,
  connected: state.connected
});

const mapDispatchToProps = {
  toggleSettings
};

export default connect(mapStateToProps, mapDispatchToProps)(StatusBar);
