const {Recognizer, recognize, Recorder, VAD} = require('nodejs-speech-kiosk-usercase')
// const rnnoise = require('rnnoise-wasm') // сделать npm unlink
const SuperpoweredModule = require('./superpowered/superpowered')

const {log} = console

const Superpowered = SuperpoweredModule({
    licenseKey: 'ExampleLicenseKey-WillExpire-OnNextUpdate', // https://superpowered.com/dev/
    enableAudioEffects: true,
    onReady: function() {
		// stuff you run after Superpowered is initialized
		log('Superpowered is ready!')
    }
})








// const player = document.getElementsByClassName('player')
const results = document.getElementById('results')
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

// const Rec = new Recognizer1({
// 	apiKeys, 
// 	onSpeechRecognized: createPlayer,
// 	onSpeechStart: () => console.log('ГОВОРИТ!'),
// 	onSpeechEnd: () => {
// 		console.log('ЗАМОЛЧАЛ!')
// 	},
// 	audioWorkletModule: audioProcessor(processors[0]),
// 	options:{
// 		// forced: false,
// 		// autoInit: false
// 	}
// })

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

function createPlayer(response, audioBuffer){
	const li = document.createElement('li')
	li.innerHTML = JSON.stringify(response)
	
	if(audioBuffer){
		const player = document.createElement('audio')
		const blob = new Blob([new Uint8Array(audioBuffer)])
		const url = URL.createObjectURL(blob)
		player.controls = true
		player.src = url
		li.prepend(player)
	}

	results.prepend(li)
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

	const mediaListener = stream => {
		this._audioContext = new AudioContext();
		this._audioContext.audioWorklet.addModule('sound-processing/recorder-processor.js')
		.then(() => {
			const sourceNode = this._audioContext.createMediaStreamSource(stream)
			const recorderNode = new AudioWorkletNode(this._audioContext, 'recorder-processor')
			sourceNode.connect(recorderNode)
			recorderNode.connect(this._audioContext.destination)

			recorderNode.port.onmessage = (e) => {
				if (e.data.eventType === 'data') {
					const audioData = e.data.audioBuffer;
					// process pcm data
					console.log('recording data', { audioData })
				}

				if (e.data.eventType === 'stop') {
					// recording has stopped
					console.log('recording has stopped')
				}
			}
			// recorderNode.start()
		})
			

		// const recorder = new Recorder(source, {numChannels: 1})

		// const onVoiceStart = () => {
		// 	this._touched = true
		// 	startRecording()
		// 	onSpeechStart()
		// }
		// const onVoiceEnd = () => {
		// 	stopRecording()
		// 	onSpeechEnd()
		// }

		// const startRecording = () => {
		// 	if(this._isSpeech2Text) recorder.record()
		// }
		// const stopRecording = () => {
		// 	restartIdleTimeout()
		// 	recorder.stop()
		// 	if(this._isSpeech2Text) recorder.exportWAV(googleSpeechRequest) // might be a bug
		// 	recorder.clear() // иначе, запись склеивается
		// }

		// const googleSpeechRequest = blob => {
		// 	const { googleCloud = [] } = apiKeys
		// 	const [googleCloudKey] = googleCloud
		// 	let reader = new FileReader()
		// 	reader.onload = async function() {
		// 		if (reader.readyState == 2) {
		// 			const uint8Array = new Uint8Array(reader.result);
		// 			const recognitionResult = await recognize(uint8Array, googleCloudKey);
		// 			onSpeechRecognized(recognitionResult)
		// 			// console.log({recognitionResult})
		// 		}
		// 	}
		// 	reader.readAsArrayBuffer(blob)
		// }

		// const forcedStartRecord = () => {
		// 	if(forced){
		// 		startRecording()
		// 	}
		// }

		// const restartIdleTimeout = () => {
		// 	clearTimeout(this._idleTimeout)
		// 	if(idleDelay){
		// 		this._idleTimeout = setTimeout(beforeStopAll, idleDelay)
		// 	}
		// }
		// const beforeStopAll = () => {
		// 	// console.log('beforeStopAll', recorder.recording)
		// 	const isRecording = recorder.recording
		// 	const wasSpeech = this._touched
		// 	const isIdleWithotSpeech = !wasSpeech && isRecording
		// 	// если делать clearTimeout(this._idleTimeout) в stopListening то не надо
		// 	// const audioNodeAlreadyClosed = this._audioContext.state === 'closed'
		// 	// if(audioNodeAlreadyClosed){
		// 	// 	console.log('lol')
		// 	// 	return
		// 	// }
		// 	if(isIdleWithotSpeech){
		// 		return this.stopAll()
		// 	}
		// 	if(isRecording){
		// 		return restartIdleTimeout()
		// 	}else{
		// 		return this.stopAll()
		// 	}
		// }

		// VAD({
		// 	...vad,
		// 	source,
		// 	voice_start: onVoiceStart,
		// 	voice_stop: onVoiceEnd,
		// 	DEBUG: true
		// })

		// onAllStart()
		// forcedStartRecord()
		// // this.startIdleTimeout()
		// restartIdleTimeout()
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
