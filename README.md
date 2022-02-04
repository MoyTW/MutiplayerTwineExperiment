Some notes on setup:
1. Copy websockets.ts / websockets.js into your project
2. Copy websockets.twee into your project
3. Toggle the `DEBUG` value in websockets.ts when you want to build; possibly change the URLs too
4. Change the $imageRoot in StoryInit if you want to use a different image folder
5. Add the following lines to the config.js:
```
/* Disable history tracking to keep file size down */
Config.history.maxStates = 1;
Config.saves.autoload = true;
```