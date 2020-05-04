const { ipcRenderer } = require('electron')
const Recorder = require('./recorder')
const VAD = require('./vad')
const {recognize} = require('./speech')

navigator.getUserMedia = navigator.getUserMedia || 
	navigator.mozGetUserMedia || 
	navigator.webkitGetUserMedia;


const keys = {
	googleCloud: ['AIzaSyDUazcuAzPVLh2ExxdphPlx4HeMk51HnfQ']
}

navigator.getUserMedia({audio: true}, 
	stream => {
		Recognizer(stream)
	},
	err => {
		console.error("No live audio input in this browser: " + err);
	}
);

function Recognizer(
	stream,
	onSpeechRecognized = res => console.log('onSpeechRecognized', res)
){
	window.AudioContext = window.AudioContext || window.webkitAudioContext;
	const audioContext = new AudioContext();
	const source = audioContext.createMediaStreamSource(stream)

	const recorder = new Recorder(source, {numChannels: 1})

	VAD({
		source,
		voice_start: onVoiceStart,
		voice_stop: onVoiceEnd,
		DEBUG: true
	})

	function onVoiceStart(){
		console.log('voice_start')
		recorder.record()
	}

	function onVoiceEnd(){
		// console.log('voice_stop')
		// recognize(stream, apiKey)
		stopRecording()
	}

	function stopRecording() {
		console.log('voice_stop')
		recorder.stop();
		// gumStream.getAudioTracks()[0].stop();
		recorder.exportWAV(googleSpeechRequest);
	}

	function googleSpeechRequest(blob) {
		let reader = new FileReader()
		reader.onload = async function() {
			if (reader.readyState == 2) {
				const uint8Array = new Uint8Array(reader.result);
				const recognitionResult = await recognize(uint8Array, API_KEY);
				onSpeechRecognized(recognitionResult)
				// console.log({recognitionResult})
			}
		}
		reader.readAsArrayBuffer(blob)
	}
}