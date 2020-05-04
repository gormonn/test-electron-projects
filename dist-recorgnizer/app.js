'use strict'
const {Recognizer} = require('nodejs-speech-kiosk-usercase')
// const {Recognizer, recognize, Recorder} = require('nodejs-speech-kiosk-usercase')
// const {Recognizer, GS, Recorder} = require('nodejs-speech-kiosk-usercase')
// const {Recorder} = require('nodejs-speech-kiosk-usercase')
// const speech = require('nodejs-speech-kiosk-usercase/src/gs/build/src')
// const log = require('electron-log')
const {GoogleAuth} = require('google-auth-library');
// const VAD = require('./vad')

// const player = document.getElementsByClassName('player')
const resultsDiv = document.getElementById('results')
const players = document.getElementById('players')

const apiKeys = {
	googleCloud: ['AIzaSyDUazcuAzPVLh2ExxdphPlx4HeMk51HnfQ']
}
const processors = [
	'one-pole',
	'bit-crusher',
	'bypass',
	'gain',
	'recorder',
	'reverb',
];
const audioProcessor = name => ({
	name: `${name}-processor`,
	src: `./sound-processing/${name}-processor.js`
})

let time
let Rec = new Recognizer({
	apiKeys, 
	onSpeechRecognized: createPlayer,
	onSpeechStart: () => {
		// console.time('mark')
		time = performance.now()
		console.log('ГОВОРИТ!')
	},
	onSpeechEnd: () => {
		// console.timeEnd('mark')
		time = performance.now() - time
		console.log('ЗАМОЛЧАЛ!', time)
	},
	audioWorkletModule: audioProcessor(processors[0]),
	options:{
		// forced: false,
		// autoInit: false
		idleDelay: false
	}
})

const list = createProcessingsList(processors)
list.onchange = function(e){
	const {value} = e.target
	Rec.changeProcessor(audioProcessor(value))
}


// Rec.stopRecognize()
// Rec.startRecognize()
function createProcessingsList(processors){
	const select = document.getElementById('list')
	processors.forEach(name => {
		const option = document.createElement('option')
		option.value = name
		option.innerHTML = name
		select.append(option)
	})
	return select
}

function createPlayer(response, audioBuffer, vadInfo){
	console.log({vadInfo})
	const Wrapper = document.createElement('div')
	const Result = document.createElement('pre')
	const VadStart = document.createElement('pre')
	const VadEnd = document.createElement('pre')
	if(response){
		Result.textContent = JSON.stringify(response, null, 0)
	}	
	if(audioBuffer){
		const player = document.createElement('audio')
		const blob = new Blob([new Uint8Array(audioBuffer)])
		const url = URL.createObjectURL(blob)
		player.controls = true
		player.src = url
		Wrapper.prepend(player)
	}
	if(vadInfo){
		// console.log({ReactJson})
		VadStart.textContent = JSON.stringify(vadInfo.start, null, 1)
		VadEnd.textContent = JSON.stringify(vadInfo.end, null, 1)
	}
	Wrapper.append(Result)
	// Wrapper.append(VadStart)
	// Wrapper.append(VadEnd)
	resultsDiv.prepend(Wrapper)
}

function Recognizer1({
	apiKeys,
	onSpeechStart = () => console.log('voice_start'),
	onSpeechEnd = () => console.log('voice_stop'),
	onSpeechRecognized = res => console.log('onSpeechRecognized', res),
	onAllStart = () => console.log('onAllStart'),
	onAllStop = () => console.log('onAllStop'),
	options = {}
}){
	const {
		isSpeech2Text = true,
		autoInit = true,
		forced = true,
		idleDelay = 5000,
		vad = {}
	} = options
	this._isSpeech2Text = isSpeech2Text
	this._idleTimeout = null
	this._touched = false
	this._vadInfo = {}

	this.GSInit = () => {
		// GoogleSpeech
		
		// const { googleCloud = [] } = apiKeys
		// const [googleCloudKey] = googleCloud
		// const googleAuth = new GoogleAuth()
		// const auth = googleAuth.fromAPIKey(googleCloudKey)
		// this.GSClient = new speech.v1p1beta1.SpeechClient({auth})
	}

	const mediaListener = stream => {
		this._audioContext = new AudioContext();
		// const biquadFilter = this._audioContext.createBiquadFilter()
		// biquadFilter.type = 'notch'
		// biquadFilter.frequency.value = 170 // The center of the range of frequencies. Human voice - 85-255Hz 255-85=170 https://en.wikipedia.org/wiki/Voice_frequency 
		// biquadFilter.Q.value = 85

		// biquadFilter.type = 'Peaking'
		// biquadFilter.frequency.value = 255 // The center of the range of frequencies. Human voice - 85-255Hz 255-85=170 https://en.wikipedia.org/wiki/Voice_frequency 
		// biquadFilter.Q.value = .2
		// biquadFilter.gain.value = -40

		
		const Lowpass = this._audioContext.createBiquadFilter()
		Lowpass.type = 'lowshelf'
		Lowpass.frequency.value = 85 // The center of the range of frequencies. Human voice - 85-255Hz 255-85=170 https://en.wikipedia.org/wiki/Voice_frequency 
		Lowpass.Q.value = 1
		Lowpass.gain.value = -40
		
		
		const Highpass = this._audioContext.createBiquadFilter()
		Highpass.type = 'highshelf'
		Highpass.frequency.value = 255 // The center of the range of frequencies. Human voice - 85-255Hz 255-85=170 https://en.wikipedia.org/wiki/Voice_frequency 
		Highpass.Q.value = .2
		Highpass.gain.value = -40


		const source = this._audioContext.createMediaStreamSource(stream)
		source.connect(Lowpass)
		Lowpass.connect(Highpass)
		Highpass.connect(this._audioContext.destination)

		const resultSource = source//Highpass

		const recorder = new Recorder(resultSource, {numChannels: 1})
		// const recorder = new Recorder(source, {numChannels: 1})

		const onVoiceStart = logData => {
			this._vadInfo = {}
			this._vadInfo.start = logData
			this._touched = true
			startRecording()
			onSpeechStart()
		}
		const onVoiceEnd = logData => {
			this._vadInfo.end = logData
			stopRecording()
			onSpeechEnd()
		}

		const startRecording = () => {
			if(this._isSpeech2Text) recorder.record()
		}
		const stopRecording = () => {
			restartIdleTimeout()
			recorder.stop()
			if(this._isSpeech2Text) recorder.exportWAV(googleSpeechRequest) // might be a bug
			recorder.clear() // иначе, запись склеивается
		}

		const googleSpeechRequest = blob => {
			const { googleCloud = [] } = apiKeys
			const [googleCloudKey] = googleCloud
			const vadInfo = this._vadInfo
			let reader = new FileReader()
			reader.onload = async function() {
				if (reader.readyState == 2) {
					const uint8Array = new Uint8Array(reader.result);
					const recognitionResult = await recognize(uint8Array, googleCloudKey);
					onSpeechRecognized(recognitionResult, reader.result, vadInfo)
					// console.log({recognitionResult})
				}
			}
			reader.readAsArrayBuffer(blob)
		}

		// const googleSpeechRequest = blob => {
		// 	let reader = new FileReader()
		// 	const { googleCloud = [] } = apiKeys
		// 	const [ googleCloudKey ] = googleCloud
		// 	this.GSClient = new GS({apiKey: googleCloudKey})

		// 	// const { googleCloud = [] } = apiKeys
		// 	// const [googleCloudKey] = googleCloud
		// 	// const googleAuth = new GoogleAuth()
		// 	// const auth = googleAuth.fromAPIKey(googleCloudKey)
		// 	// this.GSClient = new speech.v1p1beta1.SpeechClient({auth})
		// 	reader.onload = async function() {
		// 		if (reader.readyState == 2) {
		// 			const uint8Array = new Uint8Array(reader.result);
		// 			const recognitionResult = await this.GSClient.recognize(uint8Array);
		// 			onSpeechRecognized(recognitionResult, reader.result, vadInfo)
		// 			// console.log({recognitionResult})
		// 		}
		// 	}
		// 	reader.readAsArrayBuffer(blob)
		// }

		const forcedStartRecord = () => {
			if(forced){
				startRecording()
			}
		}

		const restartIdleTimeout = () => {
			clearTimeout(this._idleTimeout)
			if(idleDelay){
				this._idleTimeout = setTimeout(beforeStopAll, idleDelay)
			}
		}
		const beforeStopAll = () => {
			// console.log('beforeStopAll', recorder.recording)
			const isRecording = recorder.recording
			const wasSpeech = this._touched
			const isIdleWithotSpeech = !wasSpeech && isRecording
			// если делать clearTimeout(this._idleTimeout) в stopListening то не надо
			// const audioNodeAlreadyClosed = this._audioContext.state === 'closed'
			// if(audioNodeAlreadyClosed){
			// 	console.log('lol')
			// 	return
			// }
			if(isIdleWithotSpeech){
				return this.stopAll()
			}
			if(isRecording){
				return restartIdleTimeout()
			}else{
				return this.stopAll()
			}
		}

		VAD({
			...vad,
			source: resultSource,
			voice_start: onVoiceStart,
			voice_stop: onVoiceEnd,
			DEBUG: false
		})

		// this.GSInit()
		

		onAllStart()
		forcedStartRecord()
		// this.startIdleTimeout()
		restartIdleTimeout()
	}

	this.startListening = () => {
		navigator.getUserMedia({audio: true}, mediaListener, err => {
			console.error("No live audio input in this browser: " + err)
		})
	}
	this.stopListening = async () => {
		// console.log('stopListening', this._audioContext.state)
		clearTimeout(this._idleTimeout)
		if(this._audioContext.state !== 'closed'){ // по сути недостижимо, ибо чистим idleTimeout
			await this._audioContext.close();
		}
	}
	
	this.stopRecognize = () => {
		this._isSpeech2Text = false
	}
	this.startRecognize = () => {
		this._isSpeech2Text = true
	}

	this.stopAll = async () => {
		// не понятно, останавливается ли запись
		this.stopRecognize()
		await this.stopListening()
		onAllStop()
	}
	this.startAll = async () => {
		this.startRecognize()
		this.startListening()
	}
	
	if(autoInit){
		this.startListening()
	}
}
