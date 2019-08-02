import * as constants from './constants';

const initialState = {
  id: '',
  container: '',
  containers: [],
  connected: false,
  shouldChangeLocation: false,
  state: '',
  portConnected: false,
  stage: 'start'
};

export default (state = initialState, action) => {
  switch (action.type) {
    case constants.SET_STAGE:
      return Object.assign({}, state, {
        stage: action.stage
      });
    case constants.TOGGLE_SETTINGS:
      return Object.assign({}, state, {
        stage: state.stage === 'settings' ? 'start' : 'settings'
      });
    case constants.PORT_CONNECTED:
      return Object.assign({}, state, {
        portConnected: true
      });
    case constants.PORT_DISCONNECTED:
      return Object.assign({}, state, {
        portConnected: false
      });
    case constants.SET_ID:
      return Object.assign({}, state, {
        id: action.id
      });
    case constants.SET_STATUS:
      return Object.assign({}, state, {
        state: action.state
      });
    case constants.SET_CONTAINER:
      return Object.assign({}, state, {
        container: state.containers[action.index] ? state.containers[action.index].container : '',
        containers: []
      });
    case constants.SET_CONTAINERS:
      return Object.assign({}, state, {
        containers: action.containers
      });
    case constants.SET_CONNECTED:
      return Object.assign({}, state, {
        connected: action.connected
      });
    case constants.SYNCHRONIZE_STATUS:
      return Object.assign({}, state, {
        id: action.status.id,
        container: action.status.container,
        state: action.status.state,
        connected: action.status.connected,
        shouldChangeLocation: action.status.shouldChangeLocation
      });
    default:
      return state;
  }
}
