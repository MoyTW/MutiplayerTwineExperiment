// I should figure out how to get TypeScript in this mix.
setup.CluePointType = {
  Person: 'PERSON',
  Place: 'PLACE'
};

setup.CluePointData = [
  // People
  {name: 'Jocelyn Brando', type: setup.CluePointType.Person, passage: 'CluePoint_JocelynBrando'},
  {name: 'Tarita Brando', type: setup.CluePointType.Person, passage: 'CluePoint_TaritaBrando'},
  {name: 'James Dean', type: setup.CluePointType.Person, passage: 'CluePoint_JamesDean'},
  {name: 'Audry Hepburn', type: setup.CluePointType.Person, passage: 'CluePoint_AudryHepburn'},
  {name: 'General Labienus', type: setup.CluePointType.Person, passage: 'CluePoint_GeneralLabienus'},
  {name: 'Horace', type: setup.CluePointType.Person, passage: 'CluePoint_Horace'},
  {name: "Horace's mother", type: setup.CluePointType.Person, passage: 'CluePoint_HoracesMother'},
  {name: 'Vitruvius Pollio', type: setup.CluePointType.Person, passage: 'CluePoint_VitruviusPollio'},
  {name: 'Napoleon Bonaparte', type: setup.CluePointType.Person, passage: 'CluePoint_NapoleonBonaparte'},
  {name: 'Otto von Bismarck', type: setup.CluePointType.Person, passage: 'CluePoint_OttoVonBismarck'},
  {name: 'Grigori Rasputin', type: setup.CluePointType.Person, passage: 'CluePoint_GrigoriRasputin'},
  {name: 'George Randolph Hearst', type: setup.CluePointType.Person, passage: 'CluePoint_GeorgeRandolphHearst'},
  {name: 'Gaius Marius', type: setup.CluePointType.Person, passage: 'CluePoint_GaiusMarius'},
  {name: 'Livia Drusilla', type: setup.CluePointType.Person, passage: 'CluePoint_LiviaDrusilla'},
  {name: 'Marie de Champagne', type: setup.CluePointType.Person, passage: 'CluePoint_MarieDeChampagne'},
   // Locations
  {name: 'The murder scene', type: setup.CluePointType.Place, passage: 'CluePoint_TheMurderScene'},
  {name: 'The Raytheon main offices', type: setup.CluePointType.Place, passage: 'CluePoint_TheRaytheonMainOffices'},
  {name: 'The Raytheon Skunkworks', type: setup.CluePointType.Place, passage: 'CluePoint_TheRaytheonSkunkworks'},
  {name: 'Gary Danko', type: setup.CluePointType.Place, passage: 'CluePoint_GaryDanko'},
  {name: 'First Connection', type: setup.CluePointType.Place, passage: 'CluePoint_FirstConnection'},
  {name: 'Golden Lotus', type: setup.CluePointType.Place, passage: 'CluePoint_GoldenLotus'},
  {name: 'Blood Diamond', type: setup.CluePointType.Place, passagee: 'CluePoint_BloodDiamond'}
];

setup.initializeCluePoints = function() {
  const cluePoints = [];
  setup.CluePointData.forEach(e => {
    cluePoints.push({
      name: e.name,
      type: e.type,
      passage: e.passage,
      known: false,
      visited: false,
      visitedBy: undefined
    })
  });
  State.setVar('$cluePoints', cluePoints);
};