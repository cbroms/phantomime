const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const { v4: uuidv4 } = require("uuid");

/* EVENT API DOCUMENTATION

**Callables**: 

`addToQueue` -> add the player to the queue. When matched, emits `enteredGame` with the state:
```js
{
  currentTask: 0, // which of the three tasks are we working on?
    currentWord: 0, // which of the three words in that task are we guessing?
    taskCompletionStatus: [
      [false, false, false],
      [false, false, false],
      [false, false, false],
    ],
    taskWords: [
      ["animal", "wealthy", "landscape"],
      ["dissection", "biology", "mystery"],
      ["sharp", "moist", "shiny"],
    ],
    role: null // am I the ghost (0) or explorer (1)?
}
```

`guess` -> make a guess as the explorer. Takes a string and compares against the current target
word. If correct, will emit one of `nextWord` or `nextTask` with the next word or task index. 
If the guess was correct and it was the last word in the last task, will emit `tasksComplete`.
For every guess, will always also emit `explorerGuessedWord` to both players with:
```js
{ 
  guess: guess, 
  correct: false // was the guess right? 
}
```

`moveObject` -> move an object as a ghost. Takes a number and emits the event `explorerGuessedWord`
with the number to both of the players. 

**Non-callables**:

`connect` -> called on connection to the server. 

`disconnect`-> called on disconnection from the server. If the player was in the queue, they will be 
removed from the queue. If they were in a game, the game state is destroyed and `partnerLeft` will 
be emitted to the remaining player. The remaining player must then manually rejoin the queue. 

*/

const defaultGameState = {
  currentTask: 0, // which of the three tasks are we working on?
  currentWord: 0, // which of the three words in that task are we guessing?
  taskCompletionStatus: [
    [false, false, false],
    [false, false, false],
    [false, false, false],
  ],
  taskWords: [
    ["animal", "wealthy", "landscape"],
    ["dissection", "biology", "mystery"],
    ["sharp", "preserved", "remains"],
  ],
  hints: [
    [
      ["a _ _ _ _ _", "a _ i _ _ _", "a _ i _ _ l"],
      ["w _ _ _ _ _ _", "w _ _ l _ _ _", "w _ _ l _ _ y"],
      ["l _ _ _ _ _ _ _ _", "l _ _ d _ _ _ _ _", "l _ _ d _ _ _ p _"],
    ],
    [
      ["_ i _ _ _ _ _ _ _ _", "_ i s _ _ _ _ _ _ _", "_ i s _ _ _ _ _ _ n"],
      ["_ _ _ l _ _ _", "_ _ _ l o _ _", "_ i _ l o _ _"],
      ["_ _ _ t _ _ _", "_ _ _ t _ r _", "_ _ s t _ r _"],
    ],
    [
      ["_ _ a _ _", "_ h a _ _", "_ h a r _"],
      ["_ r _ _ _ _ _ _ _", "_ r _ _ _ _ _ e _", "_ r _ s _ _ _ e _"],
      ["_ _ m _ _ _ _", "_ _ m _ i _ _", "_ _ m _ i _ s"],
    ],
  ],
  role: null, // am I the ghost (0) or explorer (1)?
};

let queue = [];

const gameState = {};
const inGame = {};
const playerToGame = {};
const readingInstructions = {};

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

        console.log(`new game with players ${pair[1].id} and ${pair[0].id}`);

        // create an ID for the game
        const gameId = uuidv4();

        // record the players as being in this game
        playerToGame[pair[0].id] = gameId;
        playerToGame[pair[1].id] = gameId;

        // record the pair as being in game
        inGame[pair[0].id] = pair[1].id;
        inGame[pair[1].id] = pair[0].id;
        readingInstructions[pair[0].id] = true;
        readingInstructions[pair[1].id] = true;

        // initialize the game state
        gameState[gameId] = { ...defaultGameState };

        // add the players to the same game room
        pair[0].socket.join(gameId);
        pair[1].socket.join(gameId);

        // send the players their roles
        io.sockets
          .to(pair[0].id)
          .emit("enteredGame", { ...gameState[gameId], role: 0 });
        io.sockets
          .to(pair[1].id)
          .emit("enteredGame", { ...gameState[gameId], role: 1 });
      } else {
        // there is only one possible singleton, so add it to the new queue
        queue.push(pair[0]);
      }
    }
  }
}, 5000);

//when a client connects serve the static files in the public directory ie public/index.html
app.use(express.static("public"));

io.on("connection", (socket) => {
  console.log(`player ${socket.id} connected`);

  // add the player to the queue
  socket.on("addToQueue", () => {
    console.log(`adding player ${socket.id} to queue`);
    // add the player to the queue and wait for a partner
    queue.push({ id: socket.id, socket: socket });
  });

  socket.on("doneReading", () => {
    readingInstructions[socket.id] = false;
    if (readingInstructions[inGame[socket.id]] === false) {
      io.sockets
            .to(playerToGame[socket.id])
            .emit("showGameUI");
    }
  });

  // handle cleanup when the player leaves
  socket.on("disconnect", () => {
    console.log(`player ${socket.id} disconnected`);
    // if the player was in a game, kick the paired player out to the queue
    if (inGame[socket.id] !== undefined) {
      // tell the partner the player left
      io.sockets.to(inGame[socket.id]).emit("partnerLeft");

      // remove the players' game
      delete gameState[playerToGame[socket.id]];

      delete playerToGame[socket.id];
      delete playerToGame[inGame[socket.id]];

      // remove both players from the in-game state
      delete inGame[inGame[socket.id]];
      delete inGame[socket.id];
    } else {
      // check if the player was in the queue, and if so remove them
      const index = queue.map((player) => player.id).indexOf(socket.id);
      if (index !== -1) {
        // remove them from the queue
        queue.splice(index, 1);
      }
    }
  });

  //when I receive an explorer guess, see if it matches the answer and send to the ghost
  socket.on("guess", (guess) => {
    console.log(`player ${socket.id} guessed "${guess}"`);

    // get the current state of the game
    const game = gameState[playerToGame[socket.id]];
    // get the word the player should be guessing
    const targetWord = game.taskWords[game.currentTask][game.currentWord];

    const result = { guess: guess, correct: false };
    // to call after we emit the guessedWord event
    let nextEmit = () => {};

    // check if the guess was good
    if (guess.toLowerCase() === targetWord) {
      // mark the task as complete
      game.taskCompletionStatus[game.currentTask][game.currentWord] = true;
      // adjust the game state to move on to the next word
      if (game.currentWord < 2) {
        // move on to the next word in the task
        game.currentWord += 1;
        nextEmit = () => {
          io.sockets
            .to(playerToGame[socket.id])
            .emit("nextWord", game.currentWord);
        };
      } else if (game.currentTask < 3) {
        // move on to the next task in the game
        game.currentTask += 1;
        game.currentWord = 0;
        nextEmit = () => {
          io.sockets
            .to(playerToGame[socket.id])
            .emit("nextTask", game.currentTask);
        };
      } else { //should never get called
        // the game is complete!
        nextEmit = () => {
          io.sockets.to(playerToGame[socket.id]).emit("tasksComplete");
        };
      }

      // mark the word as correct for the players
      result.correct = true;
    }

    // send the guess and result to both the explorer and ghost
    io.sockets.to(playerToGame[socket.id]).emit("explorerGuessedWord", result);
    // call the next emit that says something about  if we've moving to the next task
    nextEmit();
  });

  // when I receive a movement, send it to both the players
  // here I'm assuming the ghost client is sending a number that will be used by
  // the explorer client to reference the same object that was clicked
  socket.on("moveObject", (obj) => {
    console.log(`player ${socket.id} moved object ${obj.num}`);
    // send the movement to the players
    io.sockets.to(playerToGame[socket.id]).emit("ghostMovedObject", obj);
  });

  socket.on("candleLit", (obj) => {
    console.log(`player ${socket.id} lit candle ${obj}`);
    // send the movement to the players
    io.sockets.to(playerToGame[socket.id]).emit("ghostLitCandle", obj);
  });

  // Taken from "guess"
  socket.on("litAllCandles", () => {
    // the game is complete!
    console.log("player completed all tasks");
    io.sockets.to(playerToGame[socket.id]).emit("tasksComplete");
  });

});

//listen to the port 3000
http.listen(3000, () => {
  console.log("listening on *:3000");
});
