// TODO: proper initialization
setup.handlers = {}

setup.registerHandler = function(messageType, handler) {
  setup.handlers[messageType] = handler;
}

// TODO: idempotent & also call on page refresh/load/broken connection
setup.websocketConnect = function(sessionId) {
  // TODO: wss
  // TODO: change localhost
  setup.chatSocket = new WebSocket('ws://127.0.0.1:8000/ws/' + sessionId + '/');

  setup.chatSocket.onmessage = function(e) {
    const data = JSON.parse(e.data);
    setup.handlers[data['type']](data);
  };

  setup.chatSocket.onclose = function(e) {
    console.error('TODO: Handle appropriately');
  }
}