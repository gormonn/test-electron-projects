const {Recognizer} = require('nodejs-speech-kiosk-usercase')

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

const Rec = new Recognizer({
	apiKeys, 
	onSpeechRecognized: createPlayer,
	onSpeechStart: () => console.log('ГОВОРИТ!'),
	onSpeechEnd: () => {
		console.log('ЗАМОЛЧАЛ!')
	},
	audioWorkletModule: audioProcessor(processors[0]),
	autoStart: false
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