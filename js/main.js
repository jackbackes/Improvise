var intervalKey = null;
var playing = false;

var currentTempo = 120;
var currentTimeSignature = [4, 4];
var currentTimeInterval = timeInterval(currentTempo);
var currentBeatTick = 0;
var currentBeat = 1;
var currentMeasure = 1;
var currentNote = {
	ticks: 1,
	note: 0,
	velocity: 120,
}
var currentLeftHandVelocity = 120;
var currentKeyRange = null;
var currentNoteLengthWeights = [1, 1, 1, 1, 1];
var currentKey = "";
var currentKeyType = "major";
var currentKeyNotes = [];
var currentLeftHand = "";

var KEY_RANGE = [21, 108];
var NOTE_LENGTHS = [16, 8, 4, 2, 1];
var OCTAVE = 12;
var NOTES = ['A','A#','B','C','C#','D','D#','E','F','F#','G','G#'];
var MAJOR_CHORD = [2, 2, 1, 2, 2, 2, 1];
var MINOR_CHORD = [2, 1, 2, 2, 1, 3, 1];
var INT_TO_NOTE = generateIntToNoteArray();
var NOTE_TO_INT = generateNoteToIntArray();
var MAJOR_CHORD_NOTES = [0, 4, 7, 12];
var MINOR_CHORD_NOTES = [0, 3, 7, 12];

var CHORD_PROGRESSION = [
	[-3, -1], [-7, 1], [0, 1], [-5, 1],
];

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

function startPlay() {
	intervalKey = setInterval(function(){play()}, currentTimeInterval);
	playing = true;
}

function stopPlay() {
	clearInterval(intervalKey);
	currentBeatTick = 0;
	currentBeat = 1;
	currentMeasure = 1;
	playing = false;
	$(".metronome li").removeClass("active");
	$(".measure").text("1");
}

function play() {
	// SET BEAT && MEASURE
	currentBeatTick += 1;
	if(currentBeatTick == currentTimeSignature[1]){
		currentBeatTick = 0
		currentBeat = (currentBeat == currentTimeSignature[0]) ? 1 : currentBeat + 1;

		// SET MEASURE
		if(currentBeat == 1){
			currentMeasure = (currentMeasure == 4) ? 1 : currentMeasure + 1;
			$(".measure").text(currentMeasure);
		}
	}

	// SET METRONOME
	$(".metronome li").removeClass("active");
	$(".metronome li:nth-child(" + currentBeat + ")").addClass("active");

	// RIGHT HAND
	currentNote.ticks -= 1;
	if(currentNote.ticks == 0){
		// SET NOTE
		currentNote.ticks = 16 / weighedRandomFromArray(NOTE_LENGTHS, currentNoteLengthWeights);
		if(currentKey == "")
			currentNote.note = randomInt(currentKeyRange[0], currentKeyRange[1]);
		else
			currentNote.note = randomFromArray(currentKeyNotes);

		// PLAY NOTE
		MIDI.noteOn(0, currentNote.note, currentNote.velocity, 0);

		// CHANGE TEMPO
		if(currentTimeInterval != timeInterval(currentTempo)) {
			currentTimeInterval = timeInterval(currentTempo);
			clearInterval(intervalKey);
			startPlay();
		}
	} else if(currentNote.ticks < 0 || isNaN(currentNote.ticks)) {
		currentNote.ticks = 0;
	}

	// LEFT HAND
	if(currentLeftHand != "") {

		// CHORDS
		if(currentLeftHand == "chords" && currentBeat == 1 && currentBeatTick == 1) {
			var chordInProgression = CHORD_PROGRESSION[currentMeasure - 1];
			var baseKey = /*INT_TO_NOTE[*/ NOTE_TO_INT[currentKey + '2'] + chordInProgression[0] /*]*/;
			/*var baseKey = NOTE_TO_INT[baseKeyName + "1"];*/
			
			var chord = [];
			var chordType = 'major';
			if( (currentKeyType == 'major' && chordInProgression[1] == -1) || (currentKeyType == 'minor' && chordInProgression[1] == 1) )
				chordType = 'minor';
			if(currentKeyType == 'minor' && chordInProgression[1] == -1)
				baseKey--;
			var NOTES = (chordType == 'major') ? MAJOR_CHORD_NOTES : MINOR_CHORD_NOTES;
			for(i in NOTES)
				chord.push(baseKey + NOTES[i]);
			MIDI.chordOn(0, chord, currentLeftHandVelocity, 0);

			console.log(baseKey);
		}
	}
}

function events(element, data) {
	$("#midi-play").on("click", function() {
		startPlay();
	});

	$("#midi-stop").on("click", function() {
		stopPlay();
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

	$("#slider-volume-right").on("slide", function( event, ui ) {
		currentNote.velocity = ui.value;
		$("#volume-right-value").text(currentNote.velocity);
	});

	$("#slider-volume-left").on("slide", function( event, ui ) {
		currentLeftHandVelocity = ui.value;
		$("#volume-left-value").text(currentLeftHandVelocity);
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

	$("#list-time-signature-top, #list-time-signature-bottom").on("change", function() {
		var wasPlaying = playing;
		if(wasPlaying)
			stopPlay();
		currentTimeSignature = [$("#list-time-signature-top").val(), 4];
		var html = '';
		for(var i = 0; i < currentTimeSignature[0]; i++) {
			html += '<li></li>';
		}
		$(".metronome").html(html);
		if(wasPlaying)
			setTimeout(function(){ startPlay() }, 1000);
	});

	$("input[name=radio-left-hand]").on("change", function() {
		currentLeftHand = $(this).val();
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