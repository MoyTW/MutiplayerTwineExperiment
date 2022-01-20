setup.Socket = {}
setup.Socket.handlers = {}
setup.Socket.sendBuffer = []

setup.Socket.DEBUG = true;
setup.Socket.DEV_SERVER_URL = 'ws://localhost:8000/ws/';
setup.Socket.PROD_SERVER_URL = 'wss://multiplayer-twine-server.herokuapp.com/ws/';

setup.Socket.registerHandler = function(messageType, handler) {
  setup.Socket.handlers[messageType] = handler;
};

setup.Socket.connect = function(sessionId, sendOnOpen) {
  // If we already have a connection or are attempting to establish a connection, leave it be!
  if (setup.chatSocket && setup.chatSocket.readyState == 0) {
    if (sendOnOpen) {
      setup.Socket.sendBuffer.push(sendOnOpen);
    }
    return;
  }
  if (setup.chatSocket && setup.chatSocket.readyState == 1) {
    if (sendOnOpen) {
      setup.chatSocket.send(JSON.stringify(sendOnOpen));
    }
    return;
  };

  State.variables.shouldBeConnected = true;

  if (setup.Socket.DEBUG === false) {
    setup.chatSocket = new WebSocket(setup.Socket.PROD_SERVER_URL + sessionId + '/');
  } else {
    setup.chatSocket = new WebSocket(setup.Socket.DEV_SERVER_URL + sessionId + '/');
  }

  if (sendOnOpen) {
    setup.Socket.sendBuffer.push(sendOnOpen);
  }
  setup.chatSocket.onopen = function(_) {
    setup.chatSocket.send(JSON.stringify({
      'type': 'CATCH_UP',
      'clientId': State.variables.clientId,
      'catchupStartMs': State.variables.websocketProcessedUpToMs || 0
    }));
    for (const toSend of setup.Socket.sendBuffer) {
      console.log('Sending buffered message, type:', toSend['type']);
      setup.chatSocket.send(JSON.stringify(toSend));
    }
    setup.Socket.sendBuffer.splice(0, setup.Socket.sendBuffer.length);
  }

  setup.chatSocket.onmessage = function(e) {
    const data = JSON.parse(e.data);
    const handler = setup.Socket.handlers[data['type']];

    console.log(data['type'], handler);

    State.variables.websocketProcessedUpToMs = data['server_timestamp_ms'];
    handler(data);
  };

  setup.chatSocket.onclose = function(e) {
    console.error('TODO: Handle appropriately');
  }
}

setup.Socket._send = function(sessionId, obj) {
  if (typeof sessionId !== 'string') {
    throw `Cannot send to session ${sessionId}`
  }
  if (typeof obj !== 'object') {
    throw `Cannot send object ${obj} to session ${sessionId} as it's not an object!`
  }
  if (setup.chatSocket && setup.chatSocket.readyState == 1) {
    setup.chatSocket.send(JSON.stringify(obj));
  } else {
    setup.Socket.connect(sessionId, obj);
  }
}

setup.Socket.registerHandler('CATCH_UP', function(data) {
  const serializedSave = data['serialized_save']
  console.log('Attempting to catch up! Loading:', serializedSave !== undefined);
  if (serializedSave) {
    Save.deserialize(serializedSave)
  }
  for (const message of data['messages']) {
    // TODO: There's surely a more elegant way of dealing with this
    if (message['type'] !== 'clientJoin') {
      const handler = setup.Socket.handlers[message['type']];
      console.log('catching up', message['type']);
      State.variables.websocketProcessedUpToMs = message['server_timestamp_ms'];
      handler(message);
    }
  }
})

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
    $('#select-character-character-buttons button').prop('disabled', true)
  } else {
    State.variables.selectCharacterPartnerConfirmed = true
  }
  if (State.variables.selectCharacterPlayerConfirmed && State.variables.selectCharacterPartnerConfirmed) {
    State.variables.websocketTimestampMs = Date.now();
    Engine.play('Ch1_CaseIntro1');
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
    if (!State.variables.nextCluePointPlayerConfirmed) {
      $('#next-clue-point-confirm button').prop('disabled', false);
    }
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
}

// Holds all the logic for progressing time & recording visits - I can already tell distributing logic like this is
// going to prove annoying. Hmm.
setup.Socket.registerHandler(setup.Socket.MessageTypes.NextCluePointConfirmed, function(data) {
  if (data.clientId === State.variables.clientId) {
    State.variables.nextCluePointPlayerConfirmed = true;
    const button = $('#next-clue-point-confirm button');
    button.html('Waiting for partner to confirm...');
    button.prop('disabled', true);
    $('#next-clue-point-clue-point-buttons button').prop('disabled', true);
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
    
    State.variables.websocketTimestampMs = Date.now();
    Engine.play('Ch2_DisplayCluePoint');
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
    State.variables.websocketTimestampMs = Date.now();
    Engine.play('Ch3_Answers');
  }
})

setup.processPassages = function() {
  const opener = /<<receive/g;
  const closer = /<<\/receive>>/g;
  const allPassages = Story.lookup();

  for (let passage of allPassages) {
    const openerMatches = [...passage.text.matchAll(opener)];
    const closerMatches = [...passage.text.matchAll(closer)];
    if (openerMatches.length == 0 && closerMatches.length == 0) {
      continue;
    }
    // We don't actually need to check that they're closed or open - Twine does that for us!

    var previousEndIdx = 0;
    for (let i = 0; i < openerMatches.length; i++) {
      const startIdx = openerMatches[i].index;
      const endIdx = closerMatches[i].index + 12; // length of <</receive>>

      if (startIdx < previousEndIdx) {
        throw 'Overlapping receive tags in passage ' + passage.title + '!';
      }
      previousEndIdx = endIdx;

      Wikifier.wikifyEval(passage.text.substring(startIdx, endIdx));
    }
  }
}

Macro.add('send', {
  skipArgs: false,
  tags: null,
  handler: function() {
    if (!State.variables.sessionId) {
      return this.error(`Cannot send; no sessionId set!`);
    }

    const rest = this.args.full.replace(this.args[0], '').slice(3).trim();

    try {
      Scripting.evalJavaScript('State.temporary.websocketTemp = ' + rest);
    } catch (err) {
      return this.error(`bad evaluation: ${typeof ex === 'object' ? err.message : err}`);
    }
    const result = State.temporary.websocketTemp;
    if (typeof result !== 'object') {
      return this.error(`evaluation of object passed to send was ${result}, not an object!`);
    }
    if (result['type'] !== undefined || result['clientId'] !== undefined) {
      return this.error(`type and clientId are reserved properties on a message object!`);
    }

    const msgObj = {type: this.args[0], clientId: State.variables.clientId};
    Object.assign(msgObj, result);
    setup.Socket._send(State.variables.sessionId, msgObj);

    if (this.payload[0].contents !== '') {
      this.createShadowWrapper(() => Wikifier.wikifyEval(this.payload[0].contents.trim()))();
    }
  }
})

/**
 * <<receive messageType>>contents<</receive>> executes contents when a message of type messageType is received.
 *
 * However, it is not assured that the macro is called on the same page as it is defined. Therefore, any contents which
 * rely on the objects of the page (say <<replace>>) will throw an error when called off-page. Avoid any such macros
 * and instead use caught javascript.
 */
Macro.add('receive', {
  tags: null,
  handler: function() {
    // TODO: Check if passage is StoryInit?
    if (typeof this.args[0] !== 'string') {
      return this.error(`${this.args[0]} is not a string, and is therefore ineligible for a receive target!`);
    }
    if (setup.Socket.handlers[this.args[0]]) {
      return;
    }

    console.log('Processing receive macro!', this.args, this.payload);

    const macroPayload = this.payload;
    setup.Socket.registerHandler(this.args[0], function(data) {
      if (State.temporary.receiveData !== undefined) {
        console.error('_receiveData is set when it should not be! Overwriting!')
      }
      State.temporary.receiveData = data;

      if (macroPayload[0].contents !== '') {
        Wikifier.wikifyEval(macroPayload[0].contents.trim());
      }

      State.temporary.receiveData = undefined;
    })
  }
})