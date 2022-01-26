(function () {
  var chatSocket: WebSocket | undefined = undefined
  const handlers: Record<string, (data: object) => void> = {}
  const sendBuffer: object[] = []

  // Deliberately not tying it into Sugarcube's debug because turning that on makes everything hideous
  const DEBUG: boolean = true;
  const DEV_SERVER_URL: string = 'ws://localhost:8000/ws/'
  const PROD_SERVER_URL: string = 'wss://multiplayer-twine-server.herokuapp.com/ws/'

  const registerHandler = function(messageType: string, handler: (data: object) => void) {
    handlers[messageType] = handler
  };

  const connect = function(sessionId: string, sendOnOpen?: object) {
    // If we already have a connection or are attempting to establish a connection, leave it be!
    if (chatSocket && chatSocket.readyState == 0) {
      if (sendOnOpen) {
        sendBuffer.push(sendOnOpen)
      }
      return;
    }
    if (chatSocket && chatSocket.readyState == 1) {
      if (sendOnOpen) {
        chatSocket.send(JSON.stringify(sendOnOpen))
      }
      return;
    };

    State.setVar('$shouldBeConnected', true)

    // @ts-ignore: Unreachable code error
    if (DEBUG === false) {
      chatSocket = new WebSocket(PROD_SERVER_URL + sessionId + '/');
    } else {
      chatSocket = new WebSocket(DEV_SERVER_URL + sessionId + '/');
    }

    if (sendOnOpen) {
      sendBuffer.push(sendOnOpen);
    }
    chatSocket.onopen = function(_: any) {
      chatSocket!.send(JSON.stringify({
        'type': 'CATCH_UP',
        'clientId': State.getVar('$clientId'),
        // We use current because we want every message since our last save
        // TODO: If you join an in-progress game through join instead of using the load button, this will be 0 and you'll
        // get the entire list, changing the state in unexpected ways!
        'catchupStartMs': (State.current as any).variables.websocketProcessedUpToMs || 0
      }));
      for (const toSend of sendBuffer) {
        console.log('Sending buffered message, type:', (toSend as any)['type']);
        chatSocket!.send(JSON.stringify(toSend));
      }
      sendBuffer.splice(0, sendBuffer.length);
    }

    chatSocket.onmessage = function(e: MessageEvent<any>) {
      const data = JSON.parse(e.data);
      const handler = handlers[data['type']];

      console.log('Processing message: ', data['type']);

      State.setVar('$websocketProcessedUpToMs', data['server_timestamp_ms'])
      handler(data);
    };

    chatSocket.onclose = function(_: any) {
      console.error('TODO: Handle appropriately');
    }
  }

  const send = function(sessionId: string, obj: object) {
    if (typeof sessionId !== 'string') {
      throw `Cannot send to session ${sessionId}`
    }
    if (typeof obj !== 'object') {
      throw `Cannot send object ${obj} to session ${sessionId} as it's not an object!`
    }
    if (chatSocket && chatSocket.readyState == 1) {
      chatSocket.send(JSON.stringify(obj));
    } else {
      connect(sessionId, obj);
    }
  }

  registerHandler('CATCH_UP', function(data: any) {
    const serializedSave = data['serialized_save']
    console.log('Attempting to catch up! Loading:', serializedSave !== undefined);
    if (serializedSave) {
      Save.deserialize(serializedSave);
    }
    for (const message of data['messages']) {
      // TODO: There's surely a more elegant way of dealing with this
      if (message['type'] !== 'clientJoin') {
        const handler = handlers[message['type']];
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
      connect(this.args[0]);
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
      send(State.getVar('$sessionId'), msgObj);

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
      if (handlers[this.args[0]]) {
        return;
      }

      console.log('Processing receive macro!', this.args, this.payload);

      const macroPayload = this.payload;
      registerHandler(this.args[0], function(data: object) {
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

  Macro.add('preprocessreceivetags', {
    handler: function() {
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
  })

  // Placed here to be close to the code.
  var hasVisitedOnPassageReady = false;
  Macro.add('managesavesonpassageready', {
    handler: function() {
      // Ensure or start the connection & catch up.
      if (State.getVar('$shouldBeConnected') === true) {
        connect(State.getVar('$sessionId'));
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
        send(State.getVar('$sessionId'), {
          'type': 'AUTOSAVE',
          'clientId': State.getVar('$clientId'),
          'serializedSave': Save.serialize()
        });
      }
    }
  })

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
}());