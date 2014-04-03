var intervalKey = null;

var currentTempo = 120;
var currentTimeSignature = [4, 4];
var currentTimeInterval = timeInterval(currentTempo);
var currentBeatTick = 0;
var currentBeat = 1;
var currentNote = {
	ticks: 1,
	note: 0,
	velocity: 150,
}
var currentKeyRange = null;
var currentNoteLengthWeights = [1, 1, 1, 1, 1];
var currentKey = "";
var currentKeyType = "major";
var currentKeyNotes = [];

var KEY_RANGE = [21, 108];
var NOTE_LENGTHS = [16, 8, 4, 2, 1];
var OCTAVE = 12;
var NOTES = ['A','A#','B','C','C#','D','D#','E','F','F#','G','G#'];
var MAJOR_CHORD = [2, 2, 1, 2, 2, 2, 1];
var MINOR_CHORD = [2, 1, 2, 2, 1, 3, 1];
var INT_TO_NOTE = generateIntToNoteArray();
var NOTE_TO_INT = generateNoteToIntArray();

$(document).ready(function() {

});

$(window).load(function() {
	//test();

	init();
	events();
});

function init() {
	currentKeyRange = KEY_RANGE;

	MIDI.loadPlugin({
		soundfontUrl: "./soundfont/",
		instrument: "acoustic_grand_piano",
		callback: null
	});
}

function initPlay() {
	intervalKey = setInterval(function(){play()}, currentTimeInterval);
}

function play() {
	// SET BEAT
	currentBeatTick += 1;
	if(currentBeatTick == currentTimeSignature[1]){
		currentBeatTick = 0
		currentBeat = (currentBeat == currentTimeSignature[0]) ? 1 : currentBeat + 1;
	}
	console.log(currentBeatTick + " | " + currentBeat);

	//console.log(currentNote);
	currentNote.ticks -= 1;
	if(currentNote.ticks == 0){
		// SET NOTE
		currentNote.ticks = 16 / weighedRandomFromArray(NOTE_LENGTHS, currentNoteLengthWeights);
		if(currentKey == "")
			currentNote.note = randomInt(currentKeyRange[0], currentKeyRange[1]);
		else
			currentNote.note = randomFromArray(currentKeyNotes);
		currentNote.velocity = 150;

		// PLAY NOTE
		MIDI.noteOn(0, currentNote.note, currentNote.velocity, 0);

		// CHANGE TEMPO
		if(currentTimeInterval != timeInterval(currentTempo)) {
			currentTimeInterval = timeInterval(currentTempo);
			console.log("HIT");
			clearInterval(intervalKey);
			initPlay();
		}
	} else if(currentNote.ticks < 0 || isNaN(currentNote.ticks)) {
		currentNote.ticks = 0;
	}
}

function events(element, data) {
	$("#midi-play").on("click", function() {
		initPlay();
	});

	$("#midi-stop").on("click", function() {
		clearInterval(intervalKey);
	});

	$("#section-length-weight input").on("input", function() {
		var index = NOTE_LENGTHS.indexOf( parseInt($(this).attr("id").split("-")[1]) );
		var weight = parseInt($(this).val());
		currentNoteLengthWeights[index] = isNaN(weight) ? 0 : weight;
	});

	$("#slider-tempo").on("slide", function( event, ui ) {
		currentTempo = ui.value;
		$("#tempo-value").text(currentTempo);
	});

	$("#slider-note-range").on( "slide", function( event, ui ) {
		currentKeyRange = [ui.values[0], ui.values[1]];
		$("#note-range-min").text(INT_TO_NOTE[ui.values[0]]);
		$("#note-range-max").text(INT_TO_NOTE[ui.values[1]]);

		restrictKeyNotes();
	});

	$("#list-keys").on("change", function() {
		currentKey = $(this).val();
		currentKeyType = $("#list-major-minor").val();
		currentKeyNotes = generateCurrentKeyNotes(currentKey);
		restrictKeyNotes();
	});

	$("#list-major-minor").on("change", function() {
		currentKey = $("#list-keys").val();
		currentKeyType = $(this).val();
		currentKeyNotes = generateCurrentKeyNotes(currentKey);
		restrictKeyNotes();
	});
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFromArray(array) {
	return array[randomInt(0, array.length - 1)];
}

function weighedRandomFromArray(array, weights) {
	var weighedArray = [];

	for(i = 0; i < array.length; i++) 
		for(j = 0; j < weights[i]; j++) 
			weighedArray.push(array[i]);

	return randomFromArray(weighedArray);
}

function restrictKeyNotes() {
	var array = generateCurrentKeyNotes(currentKey);

	// Restrict the array
	for(i in array) {
		var note = array[i];
		if(note < currentKeyRange[0] || note > currentKeyRange[1])
			delete array[i];
	}
	// Reset index
	var array2 = [];
	for(i in array)
		array2.push(array[i]);

	currentKeyNotes = array2;
}

function generateCurrentKeyNotes(key) {
	var array = [];
	var noteNum = NOTE_TO_INT[key + '0'];
	var i = 0;
	if(!isNaN(noteNum)){
		while(true) {
			if(noteNum > KEY_RANGE[1]) return array;
			array.push(noteNum);
			if(currentKeyType == 'minor')
				noteNum += MINOR_CHORD[i];
			else
				noteNum += MAJOR_CHORD[i];
			if(i < MAJOR_CHORD.length - 1)
				i++
			else
				i = 0;
		}
	}
}

function generateIntToNoteArray() {
	var array = {};
	var num = KEY_RANGE[0];
	for(i = 0; i <= 8; i++) {
		for(note in NOTES) {
			note = NOTES[note];
			array[num] = note + i;
			num++;
			if(num > KEY_RANGE[1]) return array;
		}
	}
}

function generateNoteToIntArray() {
	var array = {};
	var num = 21;
	for(i = 0; i <= 8; i++) {
		for(note in NOTES) {
			note = NOTES[note];
			array[note + i] = num;
			num++;
			if(num == 109) return array;
		}
	}
}

function timeInterval(bpm) {
	return (60 / bpm * 1000) / currentTimeSignature[1]; // Updates on the 16th note
}




function test() {
	MIDI.loadPlugin({
		soundfontUrl: "./soundfont/",
		instrument: "acoustic_grand_piano",
		callback: function() {
			var delay = 0; // play one note every quarter second
			var note = 50; // the MIDI note
			var velocity = 127; // how hard the note hits
			MIDI.noteOn(0, MIDDLE_C, velocity, delay);
		}
	});
}