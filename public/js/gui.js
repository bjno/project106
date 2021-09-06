var controlMap = [
	"sliderLfoRate",
	"sliderLfoDelayTime",
	"sliderDcoLfo",
	"sliderDcoPwm",
	"sliderDcoNoise",
	"sliderVcfFreq",
	"sliderVcfRes",
	"sliderVcfEnv",
	"sliderVcfLfo",
	"sliderVcfKybd",
	"sliderVcaLevel",
	"sliderEnvAttack",
	"sliderEnvDecay",
	"sliderEnvSustain",
	"sliderEnvRelease",
	"sliderDcoSub",
	"ledDcoOct16",
	"ledDcoOct8",
	"ledDcoOct4",
	"ledDcoOscSquare",
	"ledDcoOscSaw"
	];

	var controlName = [
		"LFO RATE",
		"LFO DELAY TIME",
		"DCO LFO",
		"DCO PWM",
		"NOISE LEVEL",
		"VCF FREQ",
		"VCF RES",
		"VCF ENV",
		"VCF LFO",
		"VCF KYBD",
		"VCA LEVEL",
		"ENV ATTACK",
		"ENV DECAY",
		"ENV SUSTAIN",
		"ENV RELEASE",
		"SUB LEVEL",
	]

var sysex = new Array(18);
var name;
var undoStack = {nhist: [], shist: [], actions: []};

registerEventHandlers();
setInitialPatch();
document.getElementById("appcontainer").style.visibility = "visible";

function registerEventHandlers() {
	var components = document.getElementsByClassName("ls");
	for (var i = 0; i < components.length; i++) {
		components[i].oninput = controlChange;
		components[i].onchange = controlDone;
	}
	components = document.getElementsByClassName("switch");
	for (var i = 0; i < components.length; i++) {
		components[i].oninput = controlChange;
		components[i].onchange = controlDone;
	}
	components = document.getElementsByClassName("grey");
	for (var i = 0; i < components.length; i++) {
		components[i].onmousedown = controlChange;
	}

	document.getElementById("patchName").onkeydown = function(e) {
		if (e.keyCode == 13) {
			this.blur();
			return false;
		}
	};

	document.getElementById("patchName").onblur = function(e) {
		this.scrollLeft = 0;
		// check if &npsp etc cause probs
		if (document.getElementById("patchName").innerHTML != name) {
			pushUndo("n", document.getElementById("patchName").innerHTML);
		}
		// here we should check if the name was updated, and if so the data is considered updated
	}
}

function importTape() {
	prepareTape();
	document.getElementById("tapedialog").showModal();
}

function import106() {
	var selector = document.getElementById("j106importer");
	selector.click();
}

function importJep() {
	var selector = document.getElementById("jepimporter");
	selector.click();
}

function startCompare() {
	updateFromSysex(undoStack.shist[0]);
	setName(undoStack.nhist[0]);
}

function stopCompare() {
	updateFromSysex(undoStack.shist[undoStack.shist.length-1]);
	setName(undoStack.nhist[undoStack.nhist.length-1]);
}

function initUndo(array, name) {
	undoStack.actions = [];
	undoStack.shist = [];
	undoStack.nhist = [];
	undoStack.shist.push(array);
	undoStack.nhist.push(name);
	document.getElementById("buttonUndo").disabled = true;
	document.getElementById("buttonCompare").disabled = true;
}

function pushUndo(action, data) {
	if (action == "n") {
		undoStack.nhist.push(data);
	} else {
		undoStack.shist.push(data);
	}
	undoStack.actions.push(action);
	if (undoStack.actions.length == 1) {
		document.getElementById("buttonUndo").disabled = false;
		document.getElementById("buttonCompare").disabled = false;
	}
}

function undo() {
	if (undoStack.actions.length > 0) {
		var revert = undoStack.actions.pop();
		if (revert == "n") {
			undoStack.nhist.pop();
			document.getElementById("patchName").innerHTML = undoStack.nhist[undoStack.nhist.length-1];
		} else {
			undoStack.shist.pop();
			updateFromSysex(undoStack.shist[undoStack.shist.length-1]);

		}

		if (undoStack.actions.length == 0) {
			document.getElementById("buttonUndo").disabled = true;
			document.getElementById("buttonCompare").disabled = true;
		}
	}
}

function save() {
	var name = document.getElementById("patchName").innerHTML;
	savePatch(name, sysex);
}

function saveCopy() {
	var name = document.getElementById("patchName").innerHTML;
	createPatch(name, sysex);
}

function controlDone(id) {
	pushUndo("s", sysex.slice());
}

function deepCompare(arr1, arr2) {
	for (var i = 0; i < 18; i++) {
		if (arr1[i] != arr2[i]) {
			return false;
		}
	}
	return true;
}

function controlChange() {
	id = this.id;
	value = this.value;
	var sysexPosition = 0;
	var stringResponse = "";
	if (id.substr(0,6) == "slider") {
		controllerId = controlMap.indexOf(id);
		sysex[controllerId] = parseInt(value);
		sysexPosition = controllerId;
		stringResponse = controlName[controllerId] + ": " + sysex[controllerId];
	} else if (id.substr(0,6) == "button") {
		if (id.substr(6,6) == "DcoOct") {
			sysex[16] |= 0b00000111;
			var subId = 4 - Math.log2(parseInt(id.substr(12,2)));
			sysex[16] &= (1 << subId) | 0b11111000;
			stringResponse = "DCO RANGE: " + id.substr(12,2) + "\'";
		}
		else if (id == "buttonDcoOscSquare") {
			var onOrOff = "ON";
			if ((sysex[16] & 8) > 0) {
				sysex[16] &= 247;
				onOrOff = "OFF";
			} else {
				sysex[16] |= 8;
			}
			stringResponse = "DCO PULSE: " + onOrOff;
		}
		else if (id == "buttonDcoOscSaw") {
			var onOrOff = "ON";
			if((sysex[16] & 16) > 0) {
				sysex[16] &= 239;
				onOrOff = "OFF";
			} else {
				sysex[16] |= 16;
			}
			stringResponse = "DCO SAW: " + onOrOff;
		}
		else if (id.substr(6,6) == "Chorus") {
			subId = parseInt(id.substr(12,1));
			stringResponse = "CHORUS: ";
			if (subId == 1) {
				sysex[16] = (sysex[16] & 31) | 64;
				stringResponse += "I";
			} else if (subId == 2) {
				sysex[16] = sysex[16] & 31;
				stringResponse += "II";
			} else {
				sysex[16] = (sysex[16] & 31) | 32;
				stringResponse += "OFF";
			}
		}
		sysexPosition = 16;
		updateLeds();
		// for buttons we call undo stack
		controlDone(id);
	} else if (id.substr(0,6) == "switch") {
		if (id == "switchDcoMode") {
			var v = parseInt(document.getElementById("switchDcoMode").value);
			sysex[17] = (sysex[17] & 254) | (1 - v);
			stringResponse = "DCO MODE: " + (v == 1 ? "LFO" : "MAN");
		} else if (id == "switchVcfMode") {
			var v = parseInt(document.getElementById("switchVcfMode").value);
			sysex[17] = (sysex[17] & 253) | ((1 - v) << 1);
			stringResponse = "VCF ENV MODE: " + (v == 1 ? "NORMAL" : "INVERT");
		} else if (id == "switchVcaMode") {
			var v = parseInt(document.getElementById("switchVcaMode").value);
			sysex[17] = (sysex[17] & 251) | ((1 - v) << 2);
			stringResponse = "VCA MODE: " + (v == 1 ? "ENV" : "GATE");
		} else if (id == "switchHpfFreq") {
			var v = parseInt(document.getElementById("switchHpfFreq").value);
			sysex[17] = (sysex[17] & 231) | ((3 - v) << 3);
			stringResponse = "HPF FREQ: " + v;
		}
		sysexPosition = 17;
	}
	setInfoLabel(stringResponse);
	sendPatchSysex(sysex, sysexPosition + numberOfHeaderBytes);
}

function setInitialPatch() {
	var newData = new Array(18);
	var name = "Untitled Preset";
	newData = [0, 0, 0, 0, 0, 127, 0, 0, 0, 0, 127, 0, 0, 0, 0, 0, 42, 29];
	document.getElementById("patchselector").value = -1;
	setPatch(newData, name);
}

function setPatch(data, name) {
	document.getElementById("info").innerHTML = "---";
	initUndo(data, name);
	setName(name);
	updateFromSysex(data);
}

function setName(name) {
	document.getElementById("patchName").innerHTML = name;
}

function setSysexLabel(theData) {
	document.getElementById("midiSysex").innerHTML = theData;
}

function setInfoLabel(theData) {
	document.getElementById("info").innerHTML = theData;
}

function updateFromSysex(array) {
	for (var i = 0; i < 18; i++) {
		sysex[i] = array[i];
	}
	updateSliders();
	updateLeds();
	updateSwitches();
	sendPatchSysex(sysex, -1);
}

function updateSwitches() {
	document.getElementById("switchDcoMode").value = 1 - (sysex[17] & 1);
	document.getElementById("switchVcfMode").value = 1 - ((sysex[17] & 2) >> 1);
	document.getElementById("switchVcaMode").value = 1 - ((sysex[17] & 4) >> 2);
	document.getElementById("switchHpfFreq").value = 3 - ((sysex[17] & 24) >> 3);
}

function updateSliders() {
	for (var id = 0; id < 16; id++) {
		var control = document.getElementById(controlMap[id]);
		control.value = sysex[id];
	}
}

function updateLeds() {
	for (var bit = 0; bit < 5; bit++) {
		if (sysex[16] & (1 << bit)) {
			document.getElementById(controlMap[16+bit]).className = "led activated";
		} else {
			document.getElementById(controlMap[16+bit]).className = "led";
		}
	}

	var ledChorus1 = document.getElementById("ledChorus1");
	var ledChorus2 = document.getElementById("ledChorus2");

	if ((sysex[16] & 32) > 0) {
		ledChorus1.className = "led";
		ledChorus2.className = "led";
	} else {
		if ((sysex[16] & 64) > 0) {
			ledChorus1.className = "led activated";
			ledChorus2.className = "led";
		} else {
			ledChorus1.className = "led";
			ledChorus2.className = "led activated";
		}
	}
}

function toHexString(array, highlightIndex) {
var str = "";

 	for (var i = 0; i < array.length; i++) {
 		val = array[i];
 		var stringVal = val.toString(16).toUpperCase();
 		if (stringVal.length == 1) {
 			stringVal = "0" + stringVal;
 		}
		if (i == highlightIndex){
			stringVal = "<span class=\"highlight\">" + stringVal + "</span>";
		}
 		str = str + stringVal;
 	}
	str = str + " (" + array.length + " bytes)";
 	return str;
 }
