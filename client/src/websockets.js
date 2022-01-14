// TODO: proper initialization
setup.Socket = {}
setup.Socket.handlers = {}

setup.Socket.registerHandler = function(messageType, handler) {
  setup.Socket.handlers[messageType] = handler;
}

// TODO: idempotent & also call on page refresh/load/broken connection
setup.Socket.connect = function(sessionId) {
  State.variables.shouldBeConnected = true;

  // TODO: wss
  // TODO: change localhost
  setup.chatSocket = new WebSocket('ws://127.0.0.1:8000/ws/' + sessionId + '/');

  setup.chatSocket.onmessage = function(e) {
    const data = JSON.parse(e.data);
    const handler = setup.Socket.handlers[data['type']]
    console.log(data['type'], handler);
    handler(data);
  };

  setup.chatSocket.onclose = function(e) {
    console.error('TODO: Handle appropriately');
  }
}

setup.Socket._send = function(sessionId, obj) {
  if (setup.chatSocket && setup.chatSocket.readyState == 1) {
    setup.chatSocket.send(JSON.stringify(obj));
  } else {
    setup.Socket.connect(sessionId);
    setup.chatSocket.onopen = function(_) {
      setup.chatSocket.send(JSON.stringify(obj));
    }
  }
}

// ##################################################
// #################### HANDLERS ####################
// ##################################################
setup.Socket.MessageTypes = {
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
  setup.Socket._send(State.variables.sessionId, {
    'type': setup.Socket.MessageTypes.CharacterSelect,
    'clientId': State.variables.clientId,
    'character': character
  });
}

setup.Socket.registerHandler(setup.Socket.MessageTypes.CharacterSelect, function(data) {
  if (data.clientId === State.variables.clientId) {
    State.variables.playerCharacterName = data.character;
    $('#select-character-player-selection').text('You have selected ' + data.character + '.')
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
  setup.Socket._send(State.variables.sessionId, {
    'type': setup.Socket.MessageTypes.CharacterConfirm,
    'clientId': State.variables.clientId
  });
}

// TODO: Cross-check selections & kick back if different
setup.Socket.registerHandler(setup.Socket.MessageTypes.CharacterConfirm, function(data) {
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
    Save.autosave.save();
  }
})

// ==================== Ch2_SelectNextCluePoint ====================
// -------------------- NextCluePointSelected --------------------
setup.sendNextCluePointSelected = function(selectedKey) {
  setup.Socket._send(State.variables.sessionId, {
    'type': setup.Socket.MessageTypes.NextCluePointSelected,
    'clientId': State.variables.clientId,
    'cluePointKey': selectedKey
  });
}

setup.Socket.registerHandler(setup.Socket.MessageTypes.NextCluePointSelected, function(data) {
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
  setup.Socket._send(State.variables.sessionId, {
    'type': setup.Socket.MessageTypes.NextCluePointConfirmed,
    'clientId': State.variables.clientId
  });
  const button = $('#next-clue-point-confirm button');
  button.html('Waiting for partner to confirm...');
  button.prop('disabled', true);
}

// Holds all the logic for progressing time & recording visits - I can already tell distributing logic like this is
// going to prove annoying. Hmm.
setup.Socket.registerHandler(setup.Socket.MessageTypes.NextCluePointConfirmed, function(data) {
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
    Save.autosave.save();
  }
})

// ==================== Ch3_Quiz ====================
setup.sendViewTheAnswersConfirmed = function() {
  setup.Socket._send(State.variables.sessionId, {
    'type': setup.Socket.MessageTypes.ViewTheAnswersConfirmed,
    'clientId': State.variables.clientId
  });
  const button = $('#view-the-answers-confirm button');
  button.html('Waiting for partner to confirm...');
  button.prop('disabled', true);
}

setup.Socket.registerHandler(setup.Socket.MessageTypes.ViewTheAnswersConfirmed, function(data) {
  if (data.clientId === State.variables.clientId) {
    State.variables.viewTheAnswersPlayerConfirmed = true;
  } else {
    State.variables.viewTheAnswersPartnerConfirmed = true;
  }
  if (State.variables.viewTheAnswersPlayerConfirmed && State.variables.viewTheAnswersPartnerConfirmed) {
    Engine.play('Ch3_Answers');
    Save.autosave.save();
  }
})