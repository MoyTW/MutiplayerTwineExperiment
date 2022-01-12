// I should figure out how to get TypeScript in this mix.
setup.CluePointType = {
  Person: 'PERSON',
  Place: 'PLACE'
}

setup.CluePointKey = {
  JocelynBrando: 'Jocelyn Brando',
  TaritaBrando: 'Tarita Brando',
  JamesDean: 'James Dean',
  AudryHepburn: 'Audry Hepburn',
  GeneralLabienus: 'General Labienus',
  Horace: 'Horace',
  HoracesMother: "Horace's mother",
  VitruviusPollio: 'Vitruvius Pollio',
  NapoleonBonaparte: 'Napoleon Bonaparte',
  OttoVonBismarck: 'Otto von Bismarck',
  GrigoriRasputin: 'Grigori Rasputin',
  GeorgeRandolphHearst: 'George Randolph Hearst',
  GaiusMarius: 'Gaius Marius',
  LiviaDrusilla: 'Livia Drusilla',
  MarieDeChampagne: 'Marie de Champagne',
  TheMurderScene: 'The murder scene',
  TheRaytheonMainOffices: 'The Raytheon main offices',
  TheRaytheonSkunkworks: 'The Raytheon Skunkworks',
  GaryDanko: 'Gary Danko',
  FirstConnection: 'First Connection',
  GoldenLotus: 'Golden Lotus',
  BloodDiamond: 'Blood Diamond',
}

setup.CluePointsInOrder = [
  setup.CluePointKey.JocelynBrando,
  setup.CluePointKey.TaritaBrando,
  setup.CluePointKey.JamesDean,
  setup.CluePointKey.AudryHepburn,
  setup.CluePointKey.GeneralLabienus,
  setup.CluePointKey.Horace,
  setup.CluePointKey.HoracesMother,
  setup.CluePointKey.VitruviusPollio,
  setup.CluePointKey.NapoleonBonaparte,
  setup.CluePointKey.OttoVonBismarck,
  setup.CluePointKey.GrigoriRasputin,
  setup.CluePointKey.GeorgeRandolphHearst,
  setup.CluePointKey.GaiusMarius,
  setup.CluePointKey.LiviaDrusilla,
  setup.CluePointKey.MarieDeChampagne,
  setup.CluePointKey.TheMurderScene,
  setup.CluePointKey.TheRaytheonMainOffices,
  setup.CluePointKey.TheRaytheonSkunkworks,
  setup.CluePointKey.GaryDanko,
  setup.CluePointKey.FirstConnection,
  setup.CluePointKey.GoldenLotus,
  setup.CluePointKey.BloodDiamond
]

setup.CluePointData = new Map();
// People
setup.CluePointData.set(setup.CluePointKey.JocelynBrando, 
  {name: 'Jocelyn Brando',
   type: setup.CluePointType.Person,
   passage: 'CluePoint_JocelynBrando',
   defaultKnown: true,
   reveals: []});
setup.CluePointData.set(setup.CluePointKey.TaritaBrando,
  {name: 'Tarita Brando',
   type: setup.CluePointType.Person,
   passage: 'CluePoint_TaritaBrando',
   defaultKnown: true,
   reveals: []});
setup.CluePointData.set(setup.CluePointKey.JamesDean,
  {name: 'James Dean',
   type: setup.CluePointType.Person,
   passage: 'CluePoint_JamesDean',
   defaultKnown: true,
   reveals: [setup.CluePointKey.VitruviusPollio,
             setup.CluePointKey.NapoleonBonaparte,
             setup.CluePointKey.GoldenLotus]});
setup.CluePointData.set(setup.CluePointKey.AudryHepburn,
  {name: 'Audry Hepburn',
   type: setup.CluePointType.Person,
   passage: 'CluePoint_AudryHepburn',
   defaultKnown: true,
   reveals: []});
setup.CluePointData.set(setup.CluePointKey.GeneralLabienus,
  {name: 'General Labienus',
  type: setup.CluePointType.Person,
  passage: 'CluePoint_GeneralLabienus',
  defaultKnown: true,
    reveals: [setup.CluePointKey.VitruviusPollio,
              setup.CluePointKey.NapoleonBonaparte,
              setup.CluePointKey.OttoVonBismarck,
              setup.CluePointKey.GrigoriRasputin]});
setup.CluePointData.set(setup.CluePointKey.Horace,
  {name: 'Horace',
   type: setup.CluePointType.Person,
   passage: 'CluePoint_Horace',
   defaultKnown: true,
   reveals: []});
setup.CluePointData.set(setup.CluePointKey.HoracesMother,
  {name: "Horace's mother",
   type: setup.CluePointType.Person,
   passage: 'CluePoint_HoracesMother',
   defaultKnown: true,
   reveals: []});
setup.CluePointData.set(setup.CluePointKey.VitruviusPollio,
  {name: 'Vitruvius Pollio',
   type: setup.CluePointType.Person,
   passage: 'CluePoint_VitruviusPollio',
   defaultKnown: false,
   reveals: [setup.CluePointKey.NapoleonBonaparte,
             setup.CluePointKey.GoldenLotus]});
setup.CluePointData.set(setup.CluePointKey.NapoleonBonaparte,
  {name: 'Napoleon Bonaparte',
   type: setup.CluePointType.Person,
   passage: 'CluePoint_NapoleonBonaparte',
   defaultKnown: false,
   reveals: [setup.CluePointKey.GoldenLotus]});
setup.CluePointData.set(setup.CluePointKey.OttoVonBismarck,
  {name: 'Otto von Bismarck',
   type: setup.CluePointType.Person,
   passage: 'CluePoint_OttoVonBismarck',
   defaultKnown: false,
   reveals: []});
setup.CluePointData.set(setup.CluePointKey.GrigoriRasputin,
  {name: 'Grigori Rasputin',
   type: setup.CluePointType.Person,
   passage: 'CluePoint_GrigoriRasputin',
   defaultKnown: false,
   reveals: []});
setup.CluePointData.set(setup.CluePointKey.GeorgeRandolphHearst,
  {name: 'George Randolph Hearst',
   type: setup.CluePointType.Person,
   passage: 'CluePoint_GeorgeRandolphHearst',
   defaultKnown: false,
   reveals: []});
setup.CluePointData.set(setup.CluePointKey.GaiusMarius,
  {name: 'Gaius Marius',
   type: setup.CluePointType.Person,
   passage: 'CluePoint_GaiusMarius',
   defaultKnown: false,
   reveals: []});
setup.CluePointData.set(setup.CluePointKey.LiviaDrusilla,
  {name: 'Livia Drusilla',
   type: setup.CluePointType.Person,
   passage: 'CluePoint_LiviaDrusilla',
   defaultKnown: false,
   reveals: []});
setup.CluePointData.set(setup.CluePointKey.MarieDeChampagne,
  {name: 'Marie de Champagne',
   type: setup.CluePointType.Person,
   passage: 'CluePoint_MarieDeChampagne',
   defaultKnown: false,
   reveals: []});
// Locations
setup.CluePointData.set(setup.CluePointKey.TheMurderScene,
  {name: 'The murder scene',
   type: setup.CluePointType.Place,
   passage: 'CluePoint_TheMurderScene',
   defaultKnown: true,
   reveals: [setup.CluePointKey.GoldenLotus]});
setup.CluePointData.set(setup.CluePointKey.TheRaytheonMainOffices,
  {name: 'The Raytheon main offices',
   type: setup.CluePointType.Place,
   passage: 'CluePoint_TheRaytheonMainOffices',
   defaultKnown: true,
   reveals: []});
setup.CluePointData.set(setup.CluePointKey.TheRaytheonSkunkworks,
  {name: 'The Raytheon Skunkworks',
   type: setup.CluePointType.Place,
   passage: 'CluePoint_TheRaytheonSkunkworks',
   defaultKnown: true,
   reveals: [setup.CluePointKey.VitruviusPollio]});
setup.CluePointData.set(setup.CluePointKey.GaryDanko,
  {name: 'Gary Danko', type: setup.CluePointType.Place, passage: 'CluePoint_GaryDanko',
   defaultKnown: true,
   reveals: [setup.CluePointKey.BloodDiamond]});
setup.CluePointData.set(setup.CluePointKey.FirstConnection,
  {name: 'First Connection',
   type: setup.CluePointType.Place,
   passage: 'CluePoint_FirstConnection',
   defaultKnown: true,
   reveals: [setup.CluePointKey.GrigoriRasputin,
             setup.CluePointKey.GeorgeRandolphHearst]});
setup.CluePointData.set(setup.CluePointKey.GoldenLotus,
  {name: 'Golden Lotus',
   type: setup.CluePointType.Place,
   passage: 'CluePoint_GoldenLotus',
   defaultKnown: false,
   reveals: [setup.CluePointKey.NapoleonBonaparte,
             setup.CluePointKey.GaiusMarius,
             setup.CluePointKey.VitruviusPollio,
             setup.CluePointKey.LiviaDrusilla,
             setup.CluePointKey.OttoVonBismarck]});
setup.CluePointData.set(setup.CluePointKey.BloodDiamond,
  {name: 'Blood Diamond',
   type: setup.CluePointType.Place,
   passagee: 'CluePoint_BloodDiamond',
   defaultKnown: false,
   reveals: [setup.CluePointKey.MarieDeChampagne]});

setup.initializeCluePoints = function() {
  const cluePoints = new Map();
  for (let entry of setup.CluePointData.entries()) {
    cluePoints.set(entry[0], {
      // TODO: change this to a fn invocation instead
      name: entry[1].name,
      known: entry[1].defaultKnown,
      visited: false,
      visitedBy: undefined
    });
  }
  // Should be used only for saving!
  State.setVar('$cluePoints', cluePoints);
}

setup.markCluePointVisited = function(cluePointKey, visitedBy) {
  const cluePoint = State.variables.cluePoints.get(cluePointKey);
  cluePoint.visited = true;
  cluePoint.visitedBy = visitedBy;
  for (let revealedKey of setup.CluePointData.get(cluePointKey).reveals) {
    State.variables.cluePoints.get(revealedKey).known = true;
  }
}

setup.knowsAboutCluePoint = function(cluePointKey) {
  return State.variables.cluePoints.get(cluePointKey).known === true;
}

setup.getCluePointName = function(cluePointKey) {
  return setup.CluePointData.get(cluePointKey).name;
}

setup.getCluePointPassage = function(cluePointKey) {
  return setup.CluePointData.get(cluePointKey).passage;
}