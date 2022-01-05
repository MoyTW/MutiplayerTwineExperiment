setup.test = function() {
  console.log('!!!!!');
}

setup.testGet = function() {
  var oReq = new XMLHttpRequest();
  oReq.addEventListener("load", (ev) => { console.log(oReq.responseText); } );
  oReq.open("GET", "https://raw.githubusercontent.com/MoyTW/TwineExperiment/master/run.sh");
  oReq.send();
}