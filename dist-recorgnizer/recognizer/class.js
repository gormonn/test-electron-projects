const { ipcRenderer, ipcMain } = require('electron')
const Recorder = require('./recorder')

window.AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();

// class SoundRecognizer{
//     #setSource(){
//         this.source = audioContext.createMediaStreamSource(stream)
//     }
//     constructor(props = {}){
//         // состояние ожидания голосовой команды
//         this.stateStart = false
        
//     }
//     startOnRenderer(){
//         this.stateStart = true
//         this.#setSource()
//     }
//     stopOnRenderer(){
//         this.stateStart = false
//     }
//     startOnServer(){
//         ipcMain.on('googleSpeechReq', async (event, base64Content) => {
//             // console.log('googleSpeechReq', base64Content)
//             const googleAnswer = await googleSpeechMakeRequest(base64Content)
//             // const googleAnswer = 'azaza'
//             event.reply('googleSpeechRes', googleAnswer)
//         })
//     }
// }

const GOOGLE_SPEECH_REQUEST = 'googleSpeechRequest'
const GOOGLE_SPEECH_RESPONSE = 'googleSpeechResponse'
const EMPTY_FN = (handlerName) => (props) => console.error(`${handlerName} is not Specify! args:${JSON.stringify(props)}`)

export class vadRenderer {
    constructor({
        resultHandler = EMPTY_FN('resultHandler'),
    }){
        // состояние ожидания голосовой команды
        this.stateStart = false
        this.resultHandler = resultHandler
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
export class vadMain {
    constructor(){
        this.#init()
    }
    #init(){
        ipcMain.on(GOOGLE_SPEECH_REQUEST, async (event, soundBuffer) => {
            const googleResponse = await this.#googleSpeechMakeRequest(soundBuffer)
            event.reply(GOOGLE_SPEECH_RESPONSE, googleResponse)
        })
    }
    async #googleSpeechMakeRequest(){

    }
}