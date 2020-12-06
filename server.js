const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const { v4: uuidv4 } = require("uuid");

const task1 = {
  word: "tree",
};

const queue = [];

const gameState = {};
const inGame = {};
const playerToGame = {};

// QUEUE MANAGEMENT
// every five seconds, check the queue and make new pairings
setInterval(() => {
  if (queue.length >= 2) {
    // we copy the queue so if anyone joins while we're in the middle of making
    // pairs they remain and don't get removed afterwards
    const queueSnapshot = queue;
    queue = [];

    // reduce the queue to a list of pairs
    const pairs = queueSnapshot.reduce((res, v, i, arr) => {
      if (i % 2 === 0) res.push(arr.slice(i, i + 2));
      return res;
    }, []);

    for (const pair of pairs) {
      if (pair.length === 2) {
        // add the players as a pairing to the game state and give their roles

        // create an ID for the game
        const gameId = uuidv4();

        // record the players as being in this game
        playerToGame[pair[0]] = gameId;
        playerToGame[pair[1]] = gameId;

        // record the pair as being in game
        inGame[pair[0]] = pair[1];
        inGame[pair[1]] = pair[0];

        // initialize the game state
        gameState[gameId] = {};

        // send the players their roles
        io.sockets.to(pair[0]).emit("enteredGame", { role: "ghost" });
        io.sockets.to(pair[1]).emit("enteredGame", { role: "explorer" });
      } else {
        // there is only one possible singleton, so add it to the new queue
        queue.push(pair[0]);
      }
    }
  }
}, 5000);

//when a client connects serve the static files in the public directory ie public/index.html
app.use(express.static("public"));

io.on("connection", function (socket) {
  // on the first connection, add the player to the queue
  socket.on("addToQueue", () => {
    // add the player to the queue and wait for a partner
    queue.push(socket.id);
  });

  socket.on("disconnect", function () {
    console.log(`player ${socket.id} disconnected`);
    // if the player was in a game, kick the paired player out to the queue
    if (inGame[socket.id] !== undefined) {
      // tell the partner the player left
      io.sockets.to(inGame[socket.id]).emit("partnerLeft");
      // move the remaining player to the queue
      queue.push(inGame[socket.id]);
      console.log(`adding player ${inGame[socket.id]} to queue`);

      // remove the players' game
      delete gameState[playerToGame[socket.id]];

      delete playerToGame[socket.id];
      delete playerToGame[inGame[socket.id]];

      // remove both players from the in-game state
      delete inGame[inGame[socket.id]];
      delete inGame[socket.id];
    }
  });

  //when I receive a guess, see if it matches the answer and send to the ghost
  socket.on("guess", (guess) => {
    // check if the guess was good

    // send the guess to the player's partner
    io.sockets.to(inGame[socket.id]).emit("explorerGuessed", guess);
    console.log(`player ${socket.id} guessed "${guess}"`);
  });

  console.log("A user connected");

  // // generate a new keycode if it doesnt already exist
  // if (gameState.keyCode === null) {
  //   gameState.keyCode = generateKeyCode();
  // }

  // let amExplorer = false;

  // if (gameState.explorer === null) {
  //   console.log(`player ${socket.id} is explorer`);
  //   // there is no explorer yet, so make the new player the explorer
  //   amExplorer = true;
  //   gameState.explorer = socket.id;
  // }

  // var newPlayer = {
  //   id: socket.id,
  //   amExplorer: amExplorer,
  // };

  // //save the same information in my game state
  // gameState.players[socket.id] = newPlayer;

  // //this is sent to the client upon connection
  // socket.emit("serverMessage", { message: "Hello welcome!" });

  // //send the whole game state to the player that just connected
  // const playerArr = [];
  // for (const id in gameState.players) {
  //   playerArr.push(gameState.players[id]);
  // }
  // socket.emit("gameState", { ...gameState, players: playerArr });

  // // let everyone know the new player joined
  // io.sockets.emit("playerJoined", newPlayer);

  // delete the player and let everyone know that they left

  // got a disturbance from a ghost
  // socket.on("disturb", function () {
  //   // send the disturbance to everyone
  //   io.sockets.emit("playerDisturbed", { id: socket.id });
  //   console.log(`player ${socket.id} made a disturbance`);
  // });

  // socket.on("randomNew", function (myObj) {
  //   console.log("got an abject");
  // });

  // when I receive a keypress from the explorer
  // socket.on("keyPress", function (key) {
  //   // make sure it came from the explorer
  //   if (socket.id === gameState.explorer) {
  //     // update the guessed keycode
  //     gameState.guessedKeyCode += key;

  //     // if the key codes are the same length, see if they got it right
  //     if (gameState.guessedKeyCode.length === gameState.keyCode.length) {
  //       if (gameState.guessedKeyCode === gameState.keyCode) {
  //         // they got it right
  //         io.sockets.emit("codeResult", { success: true });
  //         console.log(`players guessed correctly!`);
  //         // create a new keycode
  //         gameState.keyCode = generateKeyCode();
  //         gameState.guessedKeyCode = "";

  //         // resend the state to everyone
  //         const playerArr = [];
  //         for (const id in gameState.players) {
  //           playerArr.push(id);
  //         }
  //         io.sockets.emit("gameState", { ...gameState, players: playerArr });
  //       } else {
  //         console.log(`players guessed incorrectly`);
  //         // they failed
  //         io.sockets.emit("codeResult", { success: false });
  //         gameState.guessedKeyCode = "";
  //       }
  //     } else {
  //       // send the number to everyone
  //       io.sockets.emit("keyPressed", {
  //         key: String(key),
  //         fullGuess: String(gameState.guessedKeyCode),
  //       });
  //     }
  //   }
  // });

  console.log(`there are now ${Object.keys(gameState.players).length} players`);
});

//listen to the port 5000
http.listen(3000, function () {
  console.log("listening on *:3000");
});
