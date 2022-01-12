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

setup.CluePointData = [
  // People
  {key: setup.CluePointKey.JocelynBrando, name: 'Jocelyn Brando', type: setup.CluePointType.Person, passage: 'CluePoint_JocelynBrando',
    known: true,
    reveals: []},
  {key: setup.CluePointKey.TaritaBrando, name: 'Tarita Brando', type: setup.CluePointType.Person, passage: 'CluePoint_TaritaBrando',
    known: true,
    reveals: []},
  {key: setup.CluePointKey.JamesDean, name: 'James Dean', type: setup.CluePointType.Person, passage: 'CluePoint_JamesDean',
    known: true,
    reveals: [setup.CluePointKey.VitruviusPollio,
              setup.CluePointKey.NapoleonBonaparte,
              setup.CluePointKey.GoldenLotus]},
  {key: setup.CluePointKey.AudryHepburn, name: 'Audry Hepburn', type: setup.CluePointType.Person, passage: 'CluePoint_AudryHepburn',
    known: true,
    reveals: []},
  {key: setup.CluePointKey.GeneralLabienus, name: 'General Labienus', type: setup.CluePointType.Person, passage: 'CluePoint_GeneralLabienus',
  known: true,
    reveals: [setup.CluePointKey.VitruviusPollio,
              setup.CluePointKey.NapoleonBonaparte,
              setup.CluePointKey.OttoVonBismarck,
              setup.CluePointKey.GrigoriRasputin]},
  {key: setup.CluePointKey.Horace, name: 'Horace', type: setup.CluePointType.Person, passage: 'CluePoint_Horace',
    known: true,
    reveals: []},
  {key: setup.CluePointKey.HoracesMother, name: "Horace's mother", type: setup.CluePointType.Person, passage: 'CluePoint_HoracesMother',
    known: true,
    reveals: []},
  {key: setup.CluePointKey.VitruviusPollio, name: 'Vitruvius Pollio', type: setup.CluePointType.Person, passage: 'CluePoint_VitruviusPollio',
    known: false,
    reveals: [setup.CluePointKey.NapoleonBonaparte, setup.CluePointKey.GoldenLotus]},
  {key: setup.CluePointKey.NapoleonBonaparte, name: 'Napoleon Bonaparte', type: setup.CluePointType.Person, passage: 'CluePoint_NapoleonBonaparte',
    known: false,
    reveals: [setup.CluePointKey.GoldenLotus]},
  {key: setup.CluePointKey.OttoVonBismarck, name: 'Otto von Bismarck', type: setup.CluePointType.Person, passage: 'CluePoint_OttoVonBismarck',
    known: false,
    reveals: []},
  {key: setup.CluePointKey.GrigoriRasputin, name: 'Grigori Rasputin', type: setup.CluePointType.Person, passage: 'CluePoint_GrigoriRasputin',
    known: false,
    reveals: []},
  {key: setup.CluePointKey.GeorgeRandolphHearst, name: 'George Randolph Hearst', type: setup.CluePointType.Person, passage: 'CluePoint_GeorgeRandolphHearst',
    known: false,
    reveals: []},
  {key: setup.CluePointKey.GaiusMarius, name: 'Gaius Marius', type: setup.CluePointType.Person, passage: 'CluePoint_GaiusMarius',
    known: false,
    reveals: []},
  {key: setup.CluePointKey.LiviaDrusilla, name: 'Livia Drusilla', type: setup.CluePointType.Person, passage: 'CluePoint_LiviaDrusilla',
    known: false,
    reveals: []},
  {key: setup.CluePointKey.MarieDeChampagne, name: 'Marie de Champagne', type: setup.CluePointType.Person, passage: 'CluePoint_MarieDeChampagne',
    known: false,
    reveals: []},
   // Locations
  {key: setup.CluePointKey.TheMurderScene, name: 'The murder scene', type: setup.CluePointType.Place, passage: 'CluePoint_TheMurderScene',
    known: true,
    reveals: [setup.CluePointKey.GoldenLotus]},
  {key: setup.CluePointKey.TheRaytheonMainOffices, name: 'The Raytheon main offices', type: setup.CluePointType.Place, passage: 'CluePoint_TheRaytheonMainOffices',
    known: true,
    reveals: []},
  {key: setup.CluePointKey.TheRaytheonSkunkworks, name: 'The Raytheon Skunkworks', type: setup.CluePointType.Place, passage: 'CluePoint_TheRaytheonSkunkworks',
    known: true,
    reveals: [setup.CluePointKey.VitruviusPollio]},
  {key: setup.CluePointKey.GaryDanko, name: 'Gary Danko', type: setup.CluePointType.Place, passage: 'CluePoint_GaryDanko',
    known: true,
    reveals: [setup.CluePointKey.BloodDiamond]},
  {key: setup.CluePointKey.FirstConnection, name: 'First Connection', type: setup.CluePointType.Place, passage: 'CluePoint_FirstConnection',
    known: true,
    reveals: [setup.CluePointKey.GrigoriRasputin,
              setup.CluePointKey.GeorgeRandolphHearst]},
  {key: setup.CluePointKey.GoldenLotus, name: 'Golden Lotus', type: setup.CluePointType.Place, passage: 'CluePoint_GoldenLotus',
    known: false,
    reveals: [setup.CluePointKey.NapoleonBonaparte,
              setup.CluePointKey.GaiusMarius,
              setup.CluePointKey.VitruviusPollio,
              setup.CluePointKey.LiviaDrusilla,
              setup.CluePointKey.OttoVonBismarck]},
  {key: setup.CluePointKey.BloodDiamond, name: 'Blood Diamond', type: setup.CluePointType.Place, passagee: 'CluePoint_BloodDiamond',
    known: false,
    reveals: [setup.CluePointKey.MarieDeChampagne]}
]

setup.initializeCluePoints = function() {
  const cluePoints = new Map();
  setup.CluePointData.forEach(e => {
    cluePoints.set(e.key, {
      name: e.name,
      type: e.type,
      passage: e.passage,
      known: e.known,
      visited: false,
      visitedBy: undefined
    });
  });
  State.setVar('$cluePoints', cluePoints);
}

setup.markCluePointVisited() {

}