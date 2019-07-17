import React from 'react';
import {Provider} from 'react-redux';
import {createStore, applyMiddleware} from 'redux';
import {render} from 'react-dom';
import { composeWithDevTools } from 'redux-devtools-extension';

import portMiddleware from './redux/portMiddleware';
import reducer from './redux/reducer';

import Popup from './popup.jsx';

const store = createStore(reducer, composeWithDevTools(applyMiddleware(portMiddleware)));

window.store = store;

const Index = () => (
  <Provider store={store}>
    <Popup />
  </Provider>
);

render(<Index />, document.getElementById('root'));
