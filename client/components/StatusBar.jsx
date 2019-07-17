import React from 'react';
import {connect} from 'react-redux';

const StatusBar = ({state, onOpenSettings}) => (
  <div className="statusbar">
    <img className="statusbar__settings" src="images/logo.svg" alt="logo"/>
    <p className="statusbar__status">{state}</p>
    <img className="statusbar__settings" src="images/settings.png" alt="settings" onClick={onOpenSettings}/>
  </div>
);

const mapStateToProps = state => ({
  state: state.state
});

export default connect(mapStateToProps)(StatusBar);
