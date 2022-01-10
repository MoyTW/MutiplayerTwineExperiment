if [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
  python3 -m http.server 8080
elif [ "$(expr substr $(uname -s) 1 10)" == "MINGW64_NT" ]; then
  py -m http.server 8080
fi


