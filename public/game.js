let iAmGhost = false;
let index = 0;
let task = 0;
let guessesThisWord = 0;
let state = {};
let currIntroScene = 0;

const socket = io();

let SceneBG;

socket.on("connect", () => {
	show("queue");
});

socket.on("enteredGame", (data) => {
	clearInterval();
	// hide("queue");
	hide("waitingScene");

	state = data;
	iAmGhost = data.role === 0 ? true : false;
	show("introScene");
	introScene();

});

socket.on("showGameUI", () => {
	hide("introScene");
	show("scene");
	show("scene1");

	if (iAmGhost) {
		setText(
			"role",
			"You are the ghost. The word is: " + state.taskWords[task][index]
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


//TODO: make this fade??
function introScene() {
	var toShow = iAmGhost ? "ghost" : "explorer";
	setText("introText", "You are the " + toShow);
	switch(currIntroScene) {
		case 0:
			toShow = iAmGhost ? "You are trapped in the house." : "You have arrived at a house, interested in rumors about a ghost.";
			setText("introDesc", toShow);
			currIntroScene += 1;
			// setTimeout((() => introScene(currText+1)), 5000);
			return;
		case 1:
			toShow = iAmGhost ? "You want to convey certain words to the explorer so they can uncover the mystery of your death." : "You want to figure out what words the ghost is conveying to you.";
			setText("introDesc", toShow);
			currIntroScene += 1;
			// setTimeout((() => introScene(currText+1)), 5000);
			return;
		case 2:
			toShow = iAmGhost ? "You will do so by clicking on items related to the word on the screen to \"rattle\" them and alert the explorer." : "You must find the relation between the objects that the ghost rattles on the screen.";
			setText("introDesc", toShow);
			currIntroScene += 1;
			// setTimeout((() => introScene(currText+1)), 5000);
			return;
		case 3:
			toShow = iAmGhost ? "You can rattle with different intensity by setting your intensity at the top of the screen." : "Objects can rattle with different intensity based on how much the ghost wants to emphasize them.";
			setText("introDesc", toShow);
			currIntroScene += 1;
			// setTimeout((() => introScene(currText+1)), 5000);
			return;
		case 4:
			setText("introDesc", "Good luck, and beware...");
			currIntroScene += 1;
			// setTimeout((() => introScene(currText+1)), 3000);
			return;
		default:
			setText("introDesc", "Waiting for other player to read the instructions...");
			hide("introButton");
			socket.emit("doneReading");
			break;
	}
}

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
	hide("queue");
	show("waitingScene")
	setText("waitTitle", "Waiting for player to join...");

	socket.emit("addToQueue");
	var counter = 0;

	window.setInterval(() => {
			setImgSrc("queueImage", "Assets/Resources/Queue/Sprite_" + counter + ".png");
			counter++;
			counter %= 10;
	}, 500);
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
