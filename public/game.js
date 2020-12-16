let iAmGhost = false;
let index = 0;
let task = 0;
let guessesThisWord = 0;
let state = {};
let currIntroScene = 0;
let intensity = 1;
let currScene = 1;
// let candleText = [
// 	"",
// 	"Bloody wall with message",
// 	"Bloody animal footprints on ground",
// 	"Desk spattered in blood",
// 	"Dead body’s leg",
// ];
let litCandles = [false, false, false, false, false, false];

const socket = io();

let SceneBG;

socket.on("connect", () => {
	show("queue");
	// playMusic("title_music"); doesn't work
});

socket.on("enteredGame", (data) => {
	clearInterval();
	// hide("queue");
	hide("waitingScene");
	playMusic("title_music");

	state = data;
	iAmGhost = data.role === 0 ? true : false;
	show("introScene");
	introScene();
});

socket.on("showGameUI", () => {
	// Play random ambient bg every 5 seconds
	//TODO: ensure 5 random sounds per scene folder
	setInterval(() => {
		pauseMusic("ambient_scene");
		var randomAudioTrack = "Assets/Resources/Music/Scene_" + currScene + "/BG/" + (Math.floor(Math.random() * 5)) + ".mp3";
		setMusic("ambient_scene", randomAudioTrack);
		playMusic("ambient_scene");
	}, 5000);

	playMusic("ambient_bg");
	pauseMusic("title_music");
	setMusic("rattling_sound", "Assets/Resources/Music/Scene_1/rattle.mp3");
	hide("introScene");
	show("scene");
	show("scene1");
	show("guessed");

	if (iAmGhost) {
		show("intensityButtons");
		setText("role", "The word is: " + state.taskWords[task][index]);
	} else {
		show("input");
		setText("role", "Guess the word.");
	}
});

socket.on("partnerLeft", () => {
	hide("scene1");
	hide("scene2");
	hide("scene3");
	hide("hint")
	hide("lastGuess")
	hide("guessed")
	hide("role")
	hide("input")
	hide("finalscene");
	show("partnerLeft")
})

socket.on("nextWord", () => {
	//TODO: stop rattling animation here
	document.querySelectorAll('img[class^="Scene"]').forEach((elt) => {
		elt.classList.remove("shake" + intensity);
	});
	pauseMusic("rattling_sound");

	document.getElementById("guess").placeholder = "";

	guessesThisWord = 0;
	index++;
	if (iAmGhost) {
		setText("role", "The word is: " + state.taskWords[task][index]);
	}
});

socket.on("nextTask", () => {
	//TODO: stop rattling animation here
	document.querySelectorAll('img[class^="Scene"]').forEach((elt) => {
		elt.classList.remove("shake" + intensity);
	});
	pauseMusic("rattling_sound");

	
	setText("lastGuess", "");

	hide("scene1");
	hide("scene2");
	hide("scene3");
	hide("finalscene");
	
	// set the hint to nothing 
	document.getElementById("guess").placeholder = "";


	guessesThisWord = 0;
	index = 0;
	task++;

	if (task === 1) {
		currScene = 2;

		show("scene2");
		setMusic("rattling_sound", "Assets/Resources/Music/Scene_2/rattle.mp3");
	} else if (task === 2) {
		currScene = 3;
		show("scene3");
		setMusic("rattling_sound", "Assets/Resources/Music/Scene_3/rattle.mp3");
	} else if (task === 3) {
		currScene = 4;
		show("finalscene");
		hide("guessed");
		hide("input");
		hide("intensityButtons");
		hide("finalghost");
		hide("finalhand");
		hide("finalghosthand");
		setMusicLoop("rattling_sound", false);
		setMusic("rattling_sound", "Assets/Resources/Music/Scene_4/rattle.mp3");
		setText(
			"role",
			iAmGhost
				? "Click each candle to light it"
				: "Wait for the ghost to light the candles"
		);

		return;
	}

	if (iAmGhost) {
		setText("role", "The word is: " + state.taskWords[task][index]);
	}
});

socket.on("tasksComplete", () => {
	show("finalghost");
	show("finalhand");
	show("finalghosthand");
	//TODO: do we want the final image to be shown at completion??
	// hide("scene");
	document.querySelectorAll('.finalghost').forEach((elt) => {
		elt.classList.add("final-ghostanimation");
	});
	document.querySelectorAll('.finalhand').forEach((elt) => {
		elt.classList.add("final-handanimation");
	});
	document.querySelectorAll('.finalghosthand').forEach((elt) => {
		elt.classList.add("final-ghosthandanimation");
	});
	// show("complete");
});

socket.on("explorerGuessedWord", (result) => {
	setText(
		"lastGuess",
		`Last guess: ${result.guess} (${
			result.correct ? "correct! next word..." : "incorrect"
		})`
	);
});

socket.on("ghostMovedObject", (obj) => {
	var num = obj.num;
	intensity = obj.intense;

	document
		.querySelectorAll(
			'img[class^="Scene' + currScene + "-" + num.toString() + '"]'
		)
		.forEach((elt) => {
			if (num.toString() === '1' && elt.className.includes("10")) return;
			else elt.classList.add("shake" + intensity);
		});

	setMusicLoop("rattling_sound", true);
	playMusic("rattling_sound");

	// set the text bold
	//document.querySelectorAll(`.c${num.toString()}`).forEach((elt) => {
	//	elt.style.fontWeight = 600;
	//});

	// reset the text after intensity seconds
	window.setTimeout(() => {
		pauseMusic("rattling_sound");
		document
			.querySelectorAll(
				'img[class^="Scene' + currScene + "-" + num.toString() + '"]'
			)
			.forEach((elt) => {
				if (num.toString() === '1' && elt.className.includes("10")) return;
				else elt.classList.remove("shake" + intensity);
			});
	}, 2000);
});

socket.on("ghostLitCandle", (num) => {
	litCandles[num - 1] = true;
	var numLit = 0;
	var i = 0;
	for (i = 0; i < litCandles.length; i++) {
		if (litCandles[i] === true) numLit++;
	}
	var percent = Math.ceil((numLit / litCandles.length) * 100);
	console.log(percent);
	playMusic("rattling_sound");

	// set yellow filter on candle
	document
		.querySelectorAll(
			'img[class^="Scene' + currScene + "-" + num.toString() + '"]'
		)
		.forEach((elt) => {
			elt.classList.add("yellow");
		});

	// increase image contrast
	document.querySelectorAll('.finalscene-bg').forEach((elt) => {
		elt.style.filter = "brightness(" + percent + "%)";
	});

	// Only ghost sends the completion event??
	if (iAmGhost === true) {
		if (numLit === litCandles.length) {
			socket.emit("litAllCandles");
		}
	}
});

function introScene() {
	var toShow = iAmGhost ? "GHOST" : "EXPLORER";
	setText("introText", "YOU ARE THE " + toShow);
	switch (currIntroScene) {
		case 0:
			toShow = iAmGhost
				? "You are trapped in the house."
				: "You have arrived at a house, interested in rumors about a ghost.";
			setText("introDesc", toShow);
			currIntroScene += 1;
			// setTimeout((() => introScene(currText+1)), 5000);
			return;
		case 1:
			toShow = iAmGhost
				? "You want to convey certain words to the explorer so they can uncover the mystery of your death."
				: "You want to figure out what words the ghost is conveying to you.";
			setText("introDesc", toShow);
			currIntroScene += 1;
			// setTimeout((() => introScene(currText+1)), 5000);
			return;
		case 2:
			toShow = iAmGhost
				? 'You will do so by clicking on items related to the word on the screen to "rattle" them and alert the explorer.'
				: "You must find the relation between the objects that the ghost rattles on the screen.";
			setText("introDesc", toShow);
			currIntroScene += 1;
			// setTimeout((() => introScene(currText+1)), 5000);
			return;
		case 3:
			toShow = iAmGhost
				? "You can rattle with different intensity by setting your intensity at the top of the screen."
				: "Objects can rattle with different intensity based on how much the ghost wants to emphasize them.";
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
			setText(
				"introDesc",
				"Waiting for other player to read the instructions..."
			);
			hide("introButton");
			socket.emit("doneReading");
			break;
	}
}

function preload() {
	SceneBG = loadImage("Assets/Resources/Scene_1_Wall.png");
}

function setIntensity(myIntense) {
	intensity = myIntense;
	setText("currIntensity", "Current Intensity: " + intensity);
}

function lightCandle(num) {
	if (iAmGhost) {
		// If already lit, leave it alone
		if (litCandles[num - 1] === true) return;

		socket.emit("candleLit", num);
	}
}

function shakeObject(num) {
	if (iAmGhost) socket.emit("moveObject", { num: num, intense: intensity });
	// element.classList.add("shake" + intensity);
	// element.classList.remove("shake" + intensity);
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

	//setText("hint", hint);
	// add the hint as a placeholder
	document.getElementById("guess").placeholder = hint;

	const guess = document.getElementById("guess").value;
	socket.emit("guess", guess);
}

function joinQueue() {
	hide("queue");
	show("waitingScene");
	setText("waitTitle", "Waiting for player to join...");

	socket.emit("addToQueue");
	var counter = 0;

	window.setInterval(() => {
		setImgSrc(
			"queueImage",
			"Assets/Resources/Queue/Sprite_" + counter + ".png"
		);
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
