import React from 'react';
import {connect} from 'react-redux';
import t from '../util/dictionary';

const StatusBar = ({state, onOpenSettings, connected}) => (
  <div className="statusbar">
    <img className="statusbar__settings" src="images/logo.svg" alt="logo"/>
    <p className={`statusbar__status${connected ? ' statusbar__status_connected' : ''}`}>{t(state)}</p>
    <img className="statusbar__settings" src="images/settings.png" alt="settings" onClick={onOpenSettings}/>
  </div>
);

const mapStateToProps = state => ({
  state: state.state,
  connected: state.connected
});

export default connect(mapStateToProps)(StatusBar);
