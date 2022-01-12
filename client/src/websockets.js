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
    const handler = setup.handlers[data['type']]
    console.log(data['type'], handler);
    handler(data);
  };

  setup.chatSocket.onclose = function(e) {
    console.error('TODO: Handle appropriately');
  }
}

// #################### HANDLERS ####################
setup.MessageTypes = {
  CharacterSelect: 'CHARACTER_SELECT',
  CharacterConfirm: 'CHARACTER_CONFIRM',
}

// ==================== SelectCharacter ====================
// -------------------- CharacterSelect --------------------
setup.sendCharacterSelected = function(character) {
  if (character !== 'Antony' && character !== 'Cleopatra') {
    console.error(character + ' is not an allowed character!');
    return;
  }
  setup.chatSocket.send(JSON.stringify({
    'type': setup.MessageTypes.CharacterSelect,
    'clientId': State.variables.clientId,
    'character': character
  }));
}

setup.registerHandler(setup.MessageTypes.CharacterSelect, function(data) {
  if (data.clientId === State.variables.clientId) {
    State.variables.playerCharacterName = data.character;
    $('#player-selection').text('Your have selected ' + data.character + '.')
  } else {
    State.variables.partnerCharacterName = data.character;
    $('#partner-selection').text('Your partner has selected ' + data.character + '.')
  }
  // TODO: Synchronize the states
  const playerCN = State.variables.playerCharacterName;
  const partnerCN = State.variables.partnerCharacterName;
  if (playerCN !== '' && partnerCN !== '' && playerCN != partnerCN) {
    $('#confirm button').prop('disabled', false)
  } else {
    $('#confirm button').prop('disabled', true)
  }
})

// -------------------- CharacterConfirm --------------------
setup.sendCharacterConfirmed = function() {
  setup.chatSocket.send(JSON.stringify({
    'type': setup.MessageTypes.CharacterConfirm,
    'clientId': State.variables.clientId
  }));
}

// TODO: Cross-check selections & kick back if different
setup.registerHandler(setup.MessageTypes.CharacterConfirm, function(data) {
  if (data.clientId === State.variables.clientId) {
    State.variables.selectCharacterPlayerConfirmed = true
  } else {
    State.variables.selectCharacterPartnerConfirmed = true
  }
  if (State.variables.selectCharacterPlayerConfirmed && State.variables.selectCharacterPartnerConfirmed) {
    Engine.play('Ch1_CaseIntro1');
  }
})