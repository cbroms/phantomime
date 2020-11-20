var express = require("express");
var app = express();
var http = require("http").createServer(app);
var io = require("socket.io")(http);

const KEY_CODE_LENGTH = 6;

function generateKeyCode() {
  let code = "";
  for (let i = 0; i < KEY_CODE_LENGTH; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  console.log("the new keycode is: " + code);
  return code;
}

//We want the server to keep track of the whole game state
//in this case the game state are the attributes of each player
var gameState = {
  players: {},
  explorer: null,
  keyCode: null,
  guessedKeyCode: "",
};

//when a client connects serve the static files in the public directory ie public/index.html
app.use(express.static("public"));

//when a client connects the socket is established and I set up all the functions listening for events
io.on("connection", function(socket) {
  //this appears in the terminal
  console.log("A user connected");

  // generate a new keycode if it doesnt already exist
  if (gameState.keyCode === null) {
    gameState.keyCode = generateKeyCode();
  }

  let amExplorer = false;

  if (gameState.explorer === null) {
    console.log(`player ${socket.id} is explorer`);
    // there is no explorer yet, so make the new player the explorer
    amExplorer = true;
    gameState.explorer = socket.id;
  }

  var newPlayer = {
    id: socket.id,
    amExplorer: amExplorer,
  };

  //save the same information in my game state
  gameState.players[socket.id] = newPlayer;

  //this is sent to the client upon connection
  socket.emit("serverMessage", {message: "Hello welcome!"});

  //send the whole game state to the player that just connected
  const playerArr = [];
  for (const id in gameState.players) {
    playerArr.push(gameState.players[id]);
  }
  socket.emit("gameState", { ...gameState, players: playerArr });

  // let everyone know the new player joined
  io.sockets.emit("playerJoined", newPlayer);

  // delete the player and let everyone know that they left
  socket.on("disconnect", function() {
    console.log(`player ${socket.id} disconnected`);

    io.sockets.emit("playerDisconnected", { id: socket.id });
    //send the disconnect
    //delete the player object
    delete gameState.players[socket.id];
    console.log(
      `there are now ${Object.keys(gameState.players).length} players`
    );
    // if the player was the explorer, make one of the other players the new explorer
    if (gameState.explorer === socket.id) {
      for (const player in gameState.players) {
        console.log("making", player, "new explorer");
        gameState.explorer = player;
        gameState.players[player].amExplorer = true;
        socket.emit("gameState", gameState);
        break;
      }
      if (gameState.explorer === socket.id) {
        // if the game state is still the same player, set it to null beacuse htat
        // player was alone
        gameState.explorer = null;
      }
    }
  });

  //when I receive a talk send it to everybody
  socket.on("talkExplorer", function(msg) {
    // make sure it came from the explorer
    // console.log("received a chat");
    // if (socket.id === gameState.explorer) {
      io.sockets.emit("playerTalked", { id: socket.id, message: msg.message });
      console.log(`player ${socket.id} said "${msg.message}"`);
    // }
  });

  // got a disturbance from a ghost
  socket.on("disturb", function() {
    // send the disturbance to everyone
    io.sockets.emit("playerDisturbed", { id: socket.id });
    console.log(`player ${socket.id} made a disturbance`);
  });

  socket.on("randomNew", function(myObj) {
    console.log("got an abject");
  })

  // when I receive a keypress from the explorer
  socket.on("keyPress", function(key) {
    // make sure it came from the explorer
    if (socket.id === gameState.explorer) {
      // update the guessed keycode
      gameState.guessedKeyCode += key;

      // if the key codes are the same length, see if they got it right
      if (gameState.guessedKeyCode.length === gameState.keyCode.length) {
        if (gameState.guessedKeyCode === gameState.keyCode) {
          // they got it right
          io.sockets.emit("codeResult", { success: true });
          console.log(`players guessed correctly!`);
          // create a new keycode
          gameState.keyCode = generateKeyCode();
          gameState.guessedKeyCode="";

          // resend the state to everyone
          const playerArr = [];
          for (const id in gameState.players) {
            playerArr.push(id);
          }
          io.sockets.emit("gameState", { ...gameState, players: playerArr });
        } else {
          console.log(`players guessed incorrectly`);
          // they failed
          io.sockets.emit("codeResult", { success: false });
          gameState.guessedKeyCode="";
        }
      } else {
        // send the number to everyone
        io.sockets.emit("keyPressed", {
          key: String(key),
          fullGuess: String(gameState.guessedKeyCode),
        });
      }
    }
  });

  console.log(`there are now ${Object.keys(gameState.players).length} players`);
});

//listen to the port 5000
http.listen(3000, function() {
  console.log("listening on *:3000");
});
