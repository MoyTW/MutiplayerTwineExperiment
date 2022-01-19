mkdir -p html
tweego src -f sugarcube-2.36.1 -o ./html/tweego_run.html
if [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
  xdg-open http://localhost:8080/html/tweego_run.html
elif [ "$(expr substr $(uname -s) 1 10)" == "MINGW64_NT" ]; then
  start http://localhost:8080/html/tweego_run.html
fi