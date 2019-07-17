import * as constants from './constants';

const initialState = {
  id: '',
  container: '',
  containers: [],
  state: '',
  portConnected: false
};

export default (state = initialState, action) => {
  switch (action.type) {
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
        container: state.containers[action.index],
        containers: []
      });
    case constants.SET_CONTAINERS:
      return Object.assign({}, state, {
        containers: action.containers
      });
    case constants.SYNCHRONIZE_STATUS:
      return Object.assign({}, state, {
        id: action.status.id,
        container: action.status.container,
        state: action.status.state
      });
    default:
      return state;
  }
}
