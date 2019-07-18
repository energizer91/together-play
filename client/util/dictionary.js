const dictionary = {
  'initialize': 'Initialize',
  'ready': 'Ready to connect',
  'connected': 'Connected to session',
  'connecting': 'Connecting...',
  'disconnected': 'Disconnected',
  'error': 'Error'
};

export default (key) => dictionary.hasOwnProperty(key) ? dictionary[key] : key;
