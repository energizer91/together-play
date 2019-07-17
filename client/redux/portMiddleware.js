import * as actions from './actions';
import * as constants from './constants';

let port = null;

const portMiddleware = store => {
  chrome.tabs.query({active: true, currentWindow: true}, tabs => {
    port = chrome.tabs.connect(tabs[0].id);

    store.dispatch(actions.portConnected());

    port.postMessage({type: 'status'});

    port.onDisconnect.addListener(() => {
      store.dispatch(actions.portDisconnected());
    });

    port.onMessage.addListener(message => {
      switch (message.type) {
        case 'containers':
          store.dispatch(actions.setContainers(message.containers));
          break;
        case 'setId':
          store.dispatch(actions.setId(message.id));

          if (message.id && message.connect) {
            port.postMessage({type: 'connect', id: message.id});
          }
          break;
        case 'status':
          store.dispatch(actions.synchronizeStatus(message.status));
          break;
        case 'state':
          store.dispatch(actions.setStatus(message.state));
          break;
        default:
          console.log('unknown message', message);
      }
    });
  });

  return next => action => {
    next(action);

    if (!port) {
      return;
    }

    if (action.type === constants.PORT_DISCONNECT) {
      port.disconnect();
    }

    if (action.type === constants.PORT_SEND_MESSAGE) {
      port.postMessage(action.message);
    }
  }
};

export default portMiddleware;
