let iAmGhost = false;
let index = 0;
let task = 0;
let guessesThisWord = 0;
let state = {};

const socket = io();

let SceneBG;

socket.on("connect", () => {
	show("queue");
});

socket.on("enteredGame", (data) => {
	hide("queue");
	show("scene");
	show("scene1");

	// save a local version of the state
	state = data;

	if (data.role === 0) {
		iAmGhost = true;
		setText(
			"role",
			"You are the ghost. The word is: " + data.taskWords[task][index]
		);
	} else {
		show("input");
		setText("role", "You are the explorer. Guess the word.");
	}
});

socket.on("nextWord", () => {
	setText("hint", "");

	guessesThisWord = 0;
	index++;
	if (iAmGhost) {
		setText(
			"role",
			"You are the ghost. The word is: " + state.taskWords[task][index]
		);
	}
});

socket.on("nextTask", () => {
	hide("scene1");
	hide("scene2");
	hide("scene3");
	setText("hint", "");

	guessesThisWord = 0;
	index = 0;
	task++;

	if (task === 1) {
		show("scene2");
	} else if (task === 2) {
		show("scene3");
	}

	if (iAmGhost) {
		setText(
			"role",
			"You are the ghost. The word is: " + state.taskWords[task][index]
		);
	}
});

socket.on("tasksComplete", () => {
	hide("scene");
	show("complete");
});

socket.on("explorerGuessedWord", (result) => {
	setText(
		"lastGuess",
		`${result.guess} (${
			result.correct ? "correct! next word..." : "incorrect"
		})`
	);
});

socket.on("ghostMovedObject", (num) => {
	// set the text bold
	document.querySelectorAll(`.c${num.toString()}`).forEach((elt) => {
		elt.style.fontWeight = 600;
	});

	// reset the text after two seconds
	window.setTimeout(() => {
		document.querySelectorAll(`.c${num.toString()}`).forEach((elt) => {
			elt.style.fontWeight = 400;
		});
	}, 2000);
});

function preload() {
	SceneBG = loadImage('Assets/Resources/Scene_1_Wall.png');
  }


  


function shakeObject(num) {
	if (iAmGhost) socket.emit("moveObject", num);
}

function submitGuess() {
	guessesThisWord++;

	let hint = "";

	try {
		if (guessesThisWord >= 6 && guessesThisWord < 12) {
			hint = state.hints[task][index][0];
		} else if (guessesThisWord >= 12 && guessesThisWord < 18) {
			hint = state.hints[task][index][1];
		} else if (guessesThisWord >= 18) {
			hint = state.hints[task][index][2];
		}
	} catch {
		// no hint this round
	}

	setText("hint", hint);

	const guess = document.getElementById("guess").value;
	socket.emit("guess", guess);
}

function joinQueue() {
	hide("queueButton");
	setText("queueTitle", "Waiting for player to join...");
	socket.emit("addToQueue");
}

// Get the input field
var input = document.getElementById("guess");
input.addEventListener("keyup", (event) => {
	if (event.keyCode === 13) {
		submitGuess();
		// if they hit return, submit and reset content
		input.value = "";
	}
});
