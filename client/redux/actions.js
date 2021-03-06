import * as constants from './constants';

export const portConnected = () => ({
  type: constants.PORT_CONNECTED
});

export const portDisconnected = () => ({
  type: constants.PORT_DISCONNECTED
});

export const portSendMessage = (message) => ({
  type: constants.PORT_SEND_MESSAGE,
  message
});

export const setStage = stage => ({
  type: constants.SET_STAGE,
  stage
});

export const toggleSettings = () => ({
  type: constants.TOGGLE_SETTINGS
});

export const connectPort = () => ({
  type: constants.PORT_CONNECT
});

export const disconnectPort = () => ({
  type: constants.PORT_DISCONNECT
});

export const setId = id => ({
  type: constants.SET_ID,
  id
});

export const setStatus = state => ({
  type: constants.SET_STATUS,
  state
});

export const setContainers = containers => ({
  type: constants.SET_CONTAINERS,
  containers
});

export const setContainer = index => ({
  type: constants.SET_CONTAINER,
  index
});

export const setConnected = connected => ({
  type: constants.SET_CONNECTED,
  connected
});

export const synchronizeStatus = status => ({
  type: constants.SYNCHRONIZE_STATUS,
  status
});
