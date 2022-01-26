(function () {
  const _setup: any = setup as any

  _setup.Socket = {}
  _setup.Socket.handlers = {}
  _setup.Socket.sendBuffer = []

  _setup.Socket.DEBUG = true;
  _setup.Socket.DEV_SERVER_URL = 'ws://localhost:8000/ws/'
  _setup.Socket.PROD_SERVER_URL = 'wss://multiplayer-twine-server.herokuapp.com/ws/'

  _setup.Socket.registerHandler = function(messageType: string, handler: any) {
    _setup.Socket.handlers[messageType] = handler
  };

  _setup.Socket.connect = function(sessionId: string, sendOnOpen: object) {
    // If we already have a connection or are attempting to establish a connection, leave it be!
    if (_setup.chatSocket && _setup.chatSocket.readyState == 0) {
      if (sendOnOpen) {
        _setup.Socket.sendBuffer.push(sendOnOpen)
      }
      return;
    }
    if (_setup.chatSocket && _setup.chatSocket.readyState == 1) {
      if (sendOnOpen) {
        _setup.chatSocket.send(JSON.stringify(sendOnOpen))
      }
      return;
    };

    State.setVar('$shouldBeConnected', true)

    if (_setup.Socket.DEBUG === false) {
      _setup.chatSocket = new WebSocket(_setup.Socket.PROD_SERVER_URL + sessionId + '/');
    } else {
      _setup.chatSocket = new WebSocket(_setup.Socket.DEV_SERVER_URL + sessionId + '/');
    }

    if (sendOnOpen) {
      _setup.Socket.sendBuffer.push(sendOnOpen);
    }
    _setup.chatSocket.onopen = function(_: any) {
      const current = State.current as any
      _setup.chatSocket.send(JSON.stringify({
        'type': 'CATCH_UP',
        'clientId': State.getVar('$clientId'),
        // We use current because we want every message since our last save
        // TODO: If you join an in-progress game through join instead of using the load button, this will be 0 and you'll
        // get the entire list, changing the state in unexpected ways!
        'catchupStartMs': current.variables.websocketProcessedUpToMs || 0
      }));
      for (const toSend of _setup.Socket.sendBuffer) {
        console.log('Sending buffered message, type:', toSend['type']);
        _setup.chatSocket.send(JSON.stringify(toSend));
      }
      _setup.Socket.sendBuffer.splice(0, _setup.Socket.sendBuffer.length);
    }

    _setup.chatSocket.onmessage = function(e: any) {
      const data = JSON.parse(e.data);
      const handler = _setup.Socket.handlers[data['type']];

      console.log('Processing message: ', data['type']);

      State.setVar('$websocketProcessedUpToMs', data['server_timestamp_ms'])
      handler(data);
    };

    _setup.chatSocket.onclose = function(_: any) {
      console.error('TODO: Handle appropriately');
    }
  }

  _setup.Socket._send = function(sessionId: string, obj: object) {
    if (typeof sessionId !== 'string') {
      throw `Cannot send to session ${sessionId}`
    }
    if (typeof obj !== 'object') {
      throw `Cannot send object ${obj} to session ${sessionId} as it's not an object!`
    }
    if (_setup.chatSocket && _setup.chatSocket.readyState == 1) {
      _setup.chatSocket.send(JSON.stringify(obj));
    } else {
      _setup.Socket.connect(sessionId, obj);
    }
  }

  // This is an insane hack to keep this variable out of the game state.
  _setup.hasVisitedOnPassageReady = false;
  _setup.manageSavesOnPassageReady = function() {
    // Ensure or start the connection & catch up.
    if (State.getVar('$shouldBeConnected') === true) {
      _setup.Socket.connect(State.getVar('$sessionId'));
    }

    // We always want to skip the first invocation, because that's right after game start.
    if (!_setup.hasVisitedOnPassageReady) {
      // console.log('Skipping invocation due to game start!')
      _setup.hasVisitedOnPassageReady = true;
      return;
    }

    // Any following invocation will only happen after a scene transfer.
    // Note that autosave.save() and Save.serialize() DO NOT take the current state, they take the state on transition.
    // Therefore, the fact that you may or may not have had state changes due to messages when this runs is irrelevant.
    console.log('Autosaving for scene: ', State.passage, ' session: ', State.getVar('$sessionId'));
    Save.autosave.save();
    if (State.getVar('$shouldBeConnected') === true) {
      _setup.Socket._send(State.getVar('$sessionId'), {
        'type': 'AUTOSAVE',
        'clientId': State.getVar('$clientId'),
        'serializedSave': Save.serialize()
      });
    }
  }

  _setup.Socket.registerHandler('CATCH_UP', function(data: any) {
    const serializedSave = data['serialized_save']
    console.log('Attempting to catch up! Loading:', serializedSave !== undefined);
    if (serializedSave) {
      Save.deserialize(serializedSave);
    }
    for (const message of data['messages']) {
      // TODO: There's surely a more elegant way of dealing with this
      if (message['type'] !== 'clientJoin') {
        const handler = _setup.Socket.handlers[message['type']];
        console.log('catching up', message['type']);
        State.setVar('$websocketProcessedUpToMs', message['server_timestamp_ms'])
        handler(message);
      }
    }
    State.setVar('$websocketProcessedUpToMs', data['server_timestamp_ms']);
    console.log('Caught up to ' + State.getVar('$websocketProcessedUpToMs'));
  })



  Macro.add('send', {
    skipArgs: false,
    tags: null,
    handler: function() {
      if (!State.getVar('$sessionId')) {
        return this.error(`Cannot send; no sessionId set!`);
      }

      const rest = this.args.full.replace(this.args[0], '').slice(3).trim();

      try {
        Scripting.evalJavaScript('State.temporary.websocketTemp = ' + rest);
      } catch (err: any) {
        return this.error(`bad evaluation: ${typeof err === 'object' ? err.message : err}`);
      }
      const result = State.temporary.websocketTemp;
      if (typeof result !== 'object') {
        return this.error(`evaluation of object passed to send was ${result}, not an object!`);
      }
      if (result['type'] !== undefined || result['clientId'] !== undefined) {
        return this.error(`type and clientId are reserved properties on a message object!`);
      }

      const msgObj = {type: this.args[0], clientId: State.getVar('$clientId')};
      Object.assign(msgObj, result);
      _setup.Socket._send(State.getVar('$sessionId'), msgObj);

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
      if (_setup.Socket.handlers[this.args[0]]) {
        return;
      }

      console.log('Processing receive macro!', this.args, this.payload);

      const macroPayload = this.payload;
      _setup.Socket.registerHandler(this.args[0], function(data: any) {
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

  _setup.processPassages = function() {
    const opener = /<<receive/g;
    const closer = /<<\/receive>>/g;
    const allPassages = Story.lookupWith((_: TwineSugarCube.Passage) => true);
  
    for (let passage of allPassages) {
      const openerMatches = [...passage.text.matchAll(opener)];
      const closerMatches = [...passage.text.matchAll(closer)];
      if (openerMatches.length == 0 && closerMatches.length == 0) {
        continue;
      }
      // We don't actually need to check that they're closed or open - Twine does that for us!
  
      var previousEndIdx = 0;
      for (let i = 0; i < openerMatches.length; i++) {
        const startIdx: number = openerMatches[i].index!;
        const endIdx: number = closerMatches[i].index! + 12; // length of <</receive>>
  
        if (startIdx < previousEndIdx) {
          throw 'Overlapping receive tags in passage ' + passage.title + '!';
        }
        previousEndIdx = endIdx;
  
        Wikifier.wikifyEval(passage.text.substring(startIdx, endIdx));
      }
    }
  }
}());