const recognizerModule = require("./recognizer");

let searchRecognizer = recognizerModule.TRecognizer();

searchRecognizer.init();

searchRecognizer.startRecognize({
    waveProgressBar: waveProgressBar,
    onRecognize: (text) => { findByText(text); },  //окончательный результат распознавания
    onIntermediateResult: (text) => { setRecognizedText(text); },  //промежуточный результат распознавания
    onStartSpeech: () => {
        //начали слышать голос
    },
    onEndSpeech: () => {
        //закончили случашь голос
    }
}, recognizerModule.RECOGNIZER_METHOD_GOOGLE);