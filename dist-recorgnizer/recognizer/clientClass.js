const Recorder = require('./recorder')
const VAD = require('./vad')

const GOOGLE_SPEECH_REQUEST = 'googleSpeechRequest'
const GOOGLE_SPEECH_RESPONSE = 'googleSpeechResponse'
const FN_WARNING = handlerName => props =>
    console.error(`${handlerName} is not Specify! args:${JSON.stringify(props)}`)

export default class voiceProcess{
    constructor({
        handlers = {
            onResult = FN_WARNING('onResult'),
            onSpeechStart = FN_WARNING('onSpeechStart'),
            onSpeechEnd = FN_WARNING('onSpeechEnd'),
        }
    }){
        // состояние ожидания голосовой команды
        // this.stateStart = false
        this.onResult = onResult
        this.onSpeechStart = onSpeechStart
        this.onSpeechEnd = onSpeechEnd
        this.#init()
    }
    #init(){
        window.AudioContext = window.AudioContext || window.webkitAudioContext
        const audioContext = new AudioContext()
        navigator.mediaDevices.getUserMedia({audio: true}).then((stream) => {
            this.source = audioContext.createMediaStreamSource(stream)
        })
    }
}