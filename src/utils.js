// I really, really, really should figure out how to import libraries.
// From https://stackoverflow.com/questions/7905929/how-to-test-valid-uuid-guid
setup.uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i

setup.isUUID = function(s) {
  return setup.uuidRegex.test(s)
}

// From https://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid
setup.uuidv4 = function() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

setup.showDialogWithPassage = function(title, passageName) {
  Dialog.setup(title);
  Dialog.wiki(Story.get(passageName).processText());
  Dialog.open();
}

/* TODO: Bring up save management or cycle the saves or something! */
setup.leaveSession = function() {
  var openSlot = undefined;

  for (let i = 0; i < Save.slots.length; i++) {
    const saveInSlot = Save.slots.get(i);
    if (saveInSlot && saveInSlot.title.includes(State.variables.sessionId)) {
      Save.slots.save(i, 'Session ' + State.variables.sessionId);
      Save.autosave.delete();
      Engine.restart();
      return;
    }
    if (!Save.slots.has(i)) {
      openSlot = i;
    }
  }

  if (openSlot !== undefined) {
    Save.slots.save(openSlot, 'Session ' + State.variables.sessionId);
  } else {
    console.error('TODO: Too many save slots!')
  }

  Save.autosave.delete();
  Engine.restart();
}