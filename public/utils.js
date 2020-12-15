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
