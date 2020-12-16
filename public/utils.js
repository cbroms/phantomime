const show = (id) => {
	document.getElementById(id).style.display = "block";
};

const hide = (id) => {
	document.getElementById(id).style.display = "none";
};

const setText = (id, text) => {
	document.getElementById(id).innerHTML = text;
};

const setImgSrc = (id, src) => {
	document.getElementById(id).src = src;
}

const pauseMusic = (id) => {
	document.getElementById(id).pause();
}

const playMusic = (id) => {
	document.getElementById(id).play();
}

const setMusic = (id, src) => {
	document.getElementById(id).src = src;
	document.getElementById(id).pause();
}

const setMusicLoop = (id, loopVal) => {
	document.getElementById(id).loop = loopVal;
	document.getElementById(id).pause();
}
