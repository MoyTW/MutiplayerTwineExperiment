(function () {
  var _chatSocket: WebSocket | undefined = undefined
  const _handlers: Record<string, (data: object) => void> = {}
  const _sendBuffer: object[] = []

  // Deliberately not tying it into Sugarcube's debug because turning that on makes everything hideous
  const DEBUG: boolean = true;
  const DEV_SERVER_URL: string = 'ws://localhost:8000/ws/';
  const PROD_SERVER_URL: string = 'wss://multiplayer-twine-server.herokuapp.com/ws/';

  (setup as any).Websocket = {};

  (setup as any).Websocket.hasSocket = function(): boolean {
    if (_chatSocket) {
      return true
    } else {
      return false
    }
  }

  const _registerHandler = function(messageType: string, handler: (data: object) => void) {
    _handlers[messageType] = handler
  };

  const _connect = function(sessionId: string, sendOnOpen?: object) {
    // If we already have a connection or are attempting to establish a connection, leave it be!
    if (_chatSocket && _chatSocket.readyState == 0) {
      if (sendOnOpen) {
        _sendBuffer.push(sendOnOpen)
      }
      return
    } else if (_chatSocket && _chatSocket.readyState == 1) {
      if (sendOnOpen) {
        _chatSocket.send(JSON.stringify(sendOnOpen))
      }
      return
    } else if (_chatSocket) {
      console.log('chatSocket already exists, wait for it to close before opening another!')
      return
    }

    State.setVar('$shouldBeConnected', true)

    // @ts-ignore: Unreachable code error
    if (DEBUG === false) {
      _chatSocket = new WebSocket(PROD_SERVER_URL + sessionId + '/');
    } else {
      _chatSocket = new WebSocket(DEV_SERVER_URL + sessionId + '/');
    }

    if (sendOnOpen) {
      _sendBuffer.push(sendOnOpen);
    }
    _chatSocket.onopen = function(_: any) {
      _chatSocket!.send(JSON.stringify({
        'type': 'CATCH_UP',
        'clientId': State.getVar('$clientId'),
        // We use current because we want every message since our last save
        // TODO: If you join an in-progress game through join instead of using the load button, this will be 0 and you'll
        // get the entire list, changing the state in unexpected ways!
        'catchupStartMs': (State.current as any).variables.websocketProcessedUpToMs || 0
      }));
      for (const toSend of _sendBuffer) {
        console.log('Sending buffered message, type:', (toSend as any)['type']);
        _chatSocket!.send(JSON.stringify(toSend));
      }
      _sendBuffer.splice(0, _sendBuffer.length);
    }

    _chatSocket.onmessage = function(e: MessageEvent<any>) {
      const data = JSON.parse(e.data);
      const handler = _handlers[data['type']];

      console.log('Processing message: ', data['type']);

      State.setVar('$websocketProcessedUpToMs', data['server_timestamp_ms'])
      handler(data);
    };

    _chatSocket.onerror = function(ev: Event) {
      console.error('Websocket error: ', ev)
    }

    _chatSocket.onclose = function(ev: CloseEvent) {
      if (State.getVar('$shouldBeConnected') === true) {
        console.error('Websocket connection closed unexpectedly: ', ev);
        if (!Dialog.isOpen('networkerrordialog')) {
          Dialog.setup('Network error!', 'networkerrordialog');
          Dialog.wiki(Story.get('NetworkErrorDialog').processText());
          Dialog.open();
          console.log('Network error dialog opened.')
        }
      } else {
        console.log('Websocket connection closed: ', ev);
      }
      _chatSocket = undefined
    }
  }

  const _send = function(sessionId: string, obj: object) {
    if (typeof sessionId !== 'string') {
      throw `Cannot send to session ${sessionId}`
    }
    if (typeof obj !== 'object') {
      throw `Cannot send object ${obj} to session ${sessionId} as it's not an object!`
    }
    if (_chatSocket && _chatSocket.readyState == 1) {
      _chatSocket.send(JSON.stringify(obj));
    } else {
      _connect(sessionId, obj);
    }
  }

  _registerHandler('CATCH_UP', function(data: any) {
    const serializedSave = data['serialized_save']
    console.log('Attempting to catch up! Loading:', serializedSave !== undefined);
    if (serializedSave) {
      Save.deserialize(serializedSave);
    }
    for (const message of data['messages']) {
      // TODO: There's surely a more elegant way of dealing with this
      if (message['type'] !== 'clientJoin') {
        const handler = _handlers[message['type']];
        console.log('catching up', message['type']);
        State.setVar('$websocketProcessedUpToMs', message['server_timestamp_ms'])
        handler(message);
      }
    }
    State.setVar('$websocketProcessedUpToMs', data['server_timestamp_ms']);
    console.log('Caught up to ' + State.getVar('$websocketProcessedUpToMs'));
  })

  Macro.add('connect', {
    handler: function() {
      if (this.args.length != 1) {
        return this.error(`bad evaluation: connect macro can only take 1 parameter, the sessionId`);
      }
      if (typeof this.args[0] !== 'string') {
        return this.error(`bad evaluation: connect macro input ${this.args[0]} was not a string!`);
      }
      _connect(this.args[0]);
    }
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
      _send(State.getVar('$sessionId'), msgObj);

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
      if (_handlers[this.args[0]]) {
        return;
      }

      console.log(`Found receive macro for ${this.args[0]}`);

      const macroPayload = this.payload;
      _registerHandler(this.args[0], function(data: object) {
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

  const _preprocessReceiveTags = function() {
    console.log(`Preprocessing all receive tags.`)

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

  Macro.add("leavemultiplayersession", {
  /* TODO: Bring up save management or cycle the saves or something! */
    handler: function() {
      const sessionId = State.getVar('$sessionId')
      var openSlot = undefined;

      for (let i = 0; i < Save.slots.length; i++) {
        const saveInSlot = Save.slots.get(i);
        if (saveInSlot && saveInSlot.title.includes(sessionId)) {
          Save.slots.save(i, 'Session ' + sessionId);
          Save.autosave.delete();
          Engine.restart();
          return;
        }
        if (!Save.slots.has(i)) {
          openSlot = i;
        }
      }

      if (openSlot !== undefined) {
        Save.slots.save(openSlot, 'Session ' + sessionId);
      } else {
        console.error('TODO: Too many save slots!')
      }

      Save.autosave.delete();
      Engine.restart();
    }
  })

  Macro.add('endmultiplayergame', {
    handler: function() {
      const sessionId = State.getVar('$sessionId')
      for (let i = 0; i < Save.slots.length; i++) {
        const saveInSlot = Save.slots.get(i)
        if (saveInSlot && saveInSlot.title.includes(sessionId)) {
          Save.slots.delete(i)
          break
        }
      }
      Save.autosave.delete()
      Engine.restart()
    }
  })

  // We preprocess the receive tags exactly once, when the javascript is evaluated. This relies upon the fact that the
  // passages have been already loaded and Story.passages() will appropriately return them; if this ever changes, well,
  // good luck! Hopefully it won't!
  _preprocessReceiveTags()

  // When the passage starts, before the passage is rendered but after the state is changed, reconnect & attempt save
  // management. We want to skip the very first invocation on page refresh/game entry.
  var hasVisitedOnPassageReady = false;
  $(document).on(':passagestart', function (ev) {
    // Ensure or start the connection & catch up.
    if (State.getVar('$shouldBeConnected') === true) {
      _connect(State.getVar('$sessionId'));
    }

    // We always want to skip the first invocation, because that's right after game start.
    if (!hasVisitedOnPassageReady) {
      hasVisitedOnPassageReady = true;
      return;
    }

    // Any following invocation will only happen after a scene transfer.
    // Note that autosave.save() and Save.serialize() DO NOT take the current state, they take the state on transition.
    // Therefore, the fact that you may or may not have had state changes due to messages when this runs is irrelevant.
    console.log('Autosaving for scene: ', State.passage, ' session: ', State.getVar('$sessionId'));
    Save.autosave.save();
    if (State.getVar('$shouldBeConnected') === true) {
      _send(State.getVar('$sessionId'), {
        'type': 'AUTOSAVE',
        'clientId': State.getVar('$clientId'),
        'serializedSave': Save.serialize()
      });
    }
  });

  // Because the error dialog will disable the ability to exit, re-enable on dialog close
  $(document).on(':dialogclosed', function (ev) {
    $("#ui-overlay").addClass("ui-close");
    $('#ui-dialog-close').show()
  })
}());