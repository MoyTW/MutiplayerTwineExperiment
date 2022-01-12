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

// ##################################################
// #################### HANDLERS ####################
// ##################################################
setup.MessageTypes = {
  CharacterSelect: 'CHARACTER_SELECT',
  CharacterConfirm: 'CHARACTER_CONFIRM',
  NextCluePointSelected: 'NEXT_CLUE_POINT_SELECTED',
  NextCluePointConfirmed: 'NEXT_CLUE_POINT_CONFIRMED',
  ViewTheAnswersConfirmed: 'VIEW_THE_ANSWERS_CONFIRMED',
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
    $('#select-character-player-selection').text('Your have selected ' + data.character + '.')
  } else {
    State.variables.partnerCharacterName = data.character;
    $('#select-character-partner-selection').text('Your partner has selected ' + data.character + '.')
  }
  // TODO: Synchronize the states
  const playerCN = State.variables.playerCharacterName;
  const partnerCN = State.variables.partnerCharacterName;
  if (playerCN !== '' && partnerCN !== '' && playerCN != partnerCN) {
    $('#select-character-confirm button').prop('disabled', false)
  } else {
    $('#select-character-confirm button').prop('disabled', true)
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
    const button = $('#select-character-confirm button');
    button.html('Waiting for partner to confirm...');
    button.prop('disabled', true);
  } else {
    State.variables.selectCharacterPartnerConfirmed = true
  }
  if (State.variables.selectCharacterPlayerConfirmed && State.variables.selectCharacterPartnerConfirmed) {
    Engine.play('Ch1_CaseIntro1');
  }
})

// ==================== Ch2_SelectNextCluePoint ====================
// -------------------- NextCluePointSelected --------------------
setup.sendNextCluePointSelected = function(selectedKey) {
  setup.chatSocket.send(JSON.stringify({
    'type': setup.MessageTypes.NextCluePointSelected,
    'clientId': State.variables.clientId,
    'cluePointKey': selectedKey
  }));
}

setup.registerHandler(setup.MessageTypes.NextCluePointSelected, function(data) {
  if (data.clientId === State.variables.clientId) {
    State.variables.nextCluePointPlayerSelection = data.cluePointKey;
    const selectionSpan = $('#next-clue-point-player-selection');
    if (selectionSpan) {
      selectionSpan.text('You have selected ' + State.getVar('$cluePoints').get(data.cluePointKey).name + '.')
    }
  } else {
    State.variables.nextCluePointPartnerSelection = data.cluePointKey;
    const selectionSpan = $('#next-clue-point-partner-selection')
    if (selectionSpan) {
      selectionSpan.text('Your partner has selected ' + State.getVar('$cluePoints').get(data.cluePointKey).name + '.')
    }
  }
  // TODO: Synchronize the states
  const playerSelection = State.variables.nextCluePointPlayerSelection;
  const partnerSelection = State.variables.nextCluePointPartnerSelection;
  if (playerSelection !== '' && partnerSelection !== '' && playerSelection != partnerSelection) {
    $('#next-clue-point-confirm button').prop('disabled', false);
  } else {
    $('#next-clue-point-confirm button').prop('disabled', true);
  }
});

// -------------------- NextCluePointConfirmed --------------------
setup.sendNextCluePointConfirmed = function() {
  setup.chatSocket.send(JSON.stringify({
    'type': setup.MessageTypes.NextCluePointConfirmed,
    'clientId': State.variables.clientId
  }));
  const button = $('#next-clue-point-confirm button');
  button.html('Waiting for partner to confirm...');
  button.prop('disabled', true);
}

// Holds all the logic for progressing time & recording visits - I can already tell distributing logic like this is
// going to prove annoying. Hmm.
setup.registerHandler(setup.MessageTypes.NextCluePointConfirmed, function(data) {
  if (data.clientId === State.variables.clientId) {
    State.variables.nextCluePointPlayerConfirmed = true;
  } else {
    State.variables.nextCluePointPartnerConfirmed = true;
  }
  if (State.variables.nextCluePointPlayerConfirmed && State.variables.nextCluePointPartnerConfirmed) {
    State.variables.turnsRemaining -= 1;
    setup.markCluePointVisited(State.variables.nextCluePointPlayerSelection, State.variables.playerCharacterName);
    setup.markCluePointVisited(State.variables.nextCluePointPartnerSelection, State.variables.partnerCharacterName)
    State.variables.cluePointPassage = setup.getCluePointPassage(State.variables.nextCluePointPlayerSelection);

    // Wipe here, so that we can maintain if one player goes faster than the next
    State.variables.nextCluePointPlayerSelection = '';
    State.variables.nextCluePointPartnerSelection = '';
    State.variables.nextCluePointPlayerConfirmed = false;
    State.variables.nextCluePointPartnerConfirmed = false;
    
    Engine.play('Ch2_DisplayCluePoint');
  }
})

// ==================== Ch3_Quiz ====================
setup.sendViewTheAnswersConfirmed = function() {
  setup.chatSocket.send(JSON.stringify({
    'type': setup.MessageTypes.ViewTheAnswersConfirmed,
    'clientId': State.variables.clientId
  }));
  const button = $('#view-the-answers-confirm button');
  button.html('Waiting for partner to confirm...');
  button.prop('disabled', true);
}

setup.registerHandler(setup.MessageTypes.ViewTheAnswersConfirmed, function(data) {
  if (data.clientId === State.variables.clientId) {
    State.variables.viewTheAnswersPlayerConfirmed = true;
  } else {
    State.variables.viewTheAnswersPartnerConfirmed = true;
  }
  if (State.variables.viewTheAnswersPlayerConfirmed && State.variables.viewTheAnswersPartnerConfirmed) {
    Engine.play('Ch3_Answers');
  }
})