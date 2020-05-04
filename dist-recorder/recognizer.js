let sphinx = null;
// const log = require('electron-log');
const spawn = require('child_process').spawn;
const speech = require('@google-cloud/speech');
const record = require('node-record-lpcm16');

const sleep = delay => new Promise(res => setTimeout(res, delay));

const RECOGNIZER_METHOD_GOOGLE = 1;
const RECOGNIZER_METHOD_SPHINX = 2;
const RECOGNIZER_METHOD_SPHINX_FROM_FILE = 3;
module.exports.RECOGNIZER_METHOD_GOOGLE = RECOGNIZER_METHOD_GOOGLE;
module.exports.RECOGNIZER_METHOD_SPHINX = RECOGNIZER_METHOD_SPHINX;
module.exports.RECOGNIZER_METHOD_SPHINX_FROM_FILE = RECOGNIZER_METHOD_SPHINX_FROM_FILE;

module.exports.TRecognizer = class TRecognizer {
    constructor() {
        this.recordStarted = true;
        this.statusIntervalId = null;
        this.recognizerStatus = null;
        this.wave = null;
        this.waveProgressBar = null;
        this.recognizerWorkTimeoutId = null;
        this.recognizeResultTimerId = null;
        this.recognizerLastResult = "";

        this.testModeParams = {
            dic: {},
            dic_index: [],
            current_word_index: 0,
            prev_word_index: 0,
            file_result: "./recognizer-test.txt"
        };

        this.record_process = null;
        this.recognizeFileName = "/home/ubuntu/rec.wav";

        this.recognizeParams = {};
    }

    init(wave = null,waveProgressBar = null) {
        this.wave = wave;
        this.waveProgressBar = waveProgressBar;

        if(g_config.params.recognizer.method.indexOf('sphinx') >= 0) sphinx = require("node-sphinx");

        if(sphinx !== null) {
            sphinx.recognizerInit({
                //русский словарь
                hmm: path.resolve(path.join(homedir,"models/zero_ru_cont_8k_v3/zero_ru.cd_cont_4000")),
                jsgf: path.resolve(path.join(homedir,"models/zero_ru_cont_8k_v3/afimall.gram")),
                dict: path.resolve(path.join(homedir,"models/zero_ru_cont_8k_v3/ru.dic")),
            }, (error,data) => {
                if(error) {
                    log.error("Ошибка инициализации");
                    log.error(error);
                    return;
                }
                if(data.rc != 0) {
                    log.error("Ошибка инициализации PocketSphinx: rc=" + data.rc);
                    return;
                }
                log.info("PocketSphinx инициализирован");
                this.recordStarted = false;
                document.dispatchEvent(new CustomEvent("pocketsphinx-initilized"));

                this.testModeInit();
            });
        }

        this.recordStarted = false;
        document.dispatchEvent(new CustomEvent("pocketsphinx-initilized"));
    }

    startRecognizeSphinx(params = {}) {
        if(typeof params.waveProgressBar !== 'undefined') this.waveProgressBar = params.waveProgressBar;

        if(this.recordStarted) return;

        if(this.wave != null) this.wave.start();
        if(this.waveProgressBar != null) this.waveProgressBar.start();
        this.recordStarted = true;

        if(this.recognizerWorkTimeoutId != null) clearInterval(this.recognizerWorkTimeoutId);
        this.recognizerWorkTimeoutId = setTimeout(() => {
            this.recognizerWorkTimeoutId = null;
            sphinx.recognizerStop();
        },((typeof params.recognizer_interval !== 'undefined') ? params.recognizer_interval : 5000));

        sphinx.recognizerStart((error,data) => {
            let recordStarted = this.recordStarted;
            if(this.wave != null) this.wave.stop();
            if(this.waveProgressBar != null) this.waveProgressBar.stop();
            if(this.statusIntervalId != null) {
                clearTimeout(this.statusIntervalId);
                this.statusIntervalId = null;
            }
            this.recordStarted = false;

            if(error) {
                log.error("PocketSphinx recognize error:");
                log.error(error);
                return;
            }
            if(data.rc != 0) {
                log.error("Ошибка распознавания: rc=" + data.rc + "; message=" + data.result);
                return;
            }

            let words = data.result.split(" ");
            let words_static = {};
            let result = "";
            for(let i = 0;i < words.length;i++) {
                if(words[i].indexOf("noise") < 0 && words[i].indexOf("<s>") < 0) {
                    if(typeof words_static[words[i]] === 'undefined') words_static[words[i]] = 0;
                    words_static[words[i]]++;
                }
            }
            let best_word = null;
            let max_count = 0;
            for(let key in words_static) {
                if(words_static[key] > max_count) {
                    max_count = words_static[key];
                    best_word = key;
                }
            }
            if(best_word != null) {
                result = best_word.replace(/_/g," ");
            } else result = "";

            this.recognizerLastResult = result;

            if(typeof params !== 'undefined' && typeof params.onRecognize === 'function' && recordStarted) params.onRecognize(result);

        });
        if(this.statusIntervalId != null) clearTimeout(this.statusIntervalId);
        this.recognizerStatus = null;
        this.statusIntervalId = setInterval(() => {
            let status = sphinx.getRecognizerStatus();
            if(this.recognizerStatus != null) {
                if(this.recognizerStatus.inSpeech != status.inSpeech) {
                    if(status.inSpeech) {
                        if(typeof params !== 'undefined' && typeof params.onStartSpeech === 'function') params.onStartSpeech();
                    } else {
                        if(typeof params !== 'undefined' && typeof params.onEndSpeech === 'function') params.onEndSpeech();
                    }
                }
                if(!this.recognizerStatus.startedHypAnalyse && status.startedHypAnalyse) {
                    if(typeof params !== 'undefined' && typeof params.onStartHypAnalyse === 'function') params.onStartHypAnalyse();
                }

                return;
            }
            this.recognizerStatus = status;
        },50);
    }

    stopRecognizeSphinx() {
        if(this.recordStarted) {
            this.recordStarted = false;
            sphinx.recognizerStop();
        }
        if(this.wave != null) this.wave.stop();
        if(this.waveProgressBar != null) this.waveProgressBar.stop();
        if(this.statusIntervalId != null) {
            clearInterval(this.statusIntervalId);
            this.statusIntervalId = null;
        }
        if(this.recognizerWorkTimeoutId != null) {
            clearTimeout(this.recognizerWorkTimeoutId);
            this.recognizerWorkTimeoutId = null;
        }
    }

    startRecognizeFromFile(params = { }) {
        if(typeof params.waveProgressBar !== 'undefined') this.waveProgressBar = params.waveProgressBar;
        if(this.recordStarted) return;

        if(this.wave != null) this.wave.start();
        if(this.waveProgressBar != null) this.waveProgressBar.start();
        this.recordStarted = true;

        if(this.recognizerWorkTimeoutId != null) clearInterval(this.recognizerWorkTimeoutId);
        this.recognizerWorkTimeoutId = setTimeout(() => {
            this.recognizerWorkTimeoutId = null;
            if(this.record_process != null) {
                this.record_process.kill('SIGINT');
                this.record_process = null;
                this.stopRecognizeFromFile();
            }
        },((typeof params.recognizer_interval !== 'undefined') ? params.recognizer_interval : 5000));

        if(this.statusIntervalId != null) clearTimeout(this.statusIntervalId);
        this.recognizerStatus = null;

        if(this.record_process != null) {
            this.record_process.kill('SIGINT');
            this.record_process = null;
        }
        //this.record_process = spawn("rec",["-r","16k","-e","signed-integer","-b","16","-c","1",this.recognizeFileName]);
        this.record_process = spawn("arecord",["-r","16000","-f","S16_LE",this.recognizeFileName]);
    }

    stopRecognizeFromFile(params = {}) {
        if(this.record_process != null) {
            sleep(500);
            this.record_process.kill('SIGINT');
            this.record_process = null;
        }

        let recordStarted = this.recordStarted;
        if(this.wave != null) this.wave.stop();
        if(this.waveProgressBar != null) this.waveProgressBar.stop();
        if(this.statusIntervalId != null) {
            clearTimeout(this.statusIntervalId);
            this.statusIntervalId = null;
        }
        this.recordStarted = false;

        this.recognizerLastResult = "";

        if(!fs.existsSync(this.recognizeFileName) || fs.statSync(this.recognizeFileName)["size"] <= 0) return;

        //sphinx.recognizeFromFile("./rec.wav", /*this.recognizeFileName*/(error,data) => {
        sphinx.recognizeFromFile(this.recognizeFileName,(error,data) => {
            // log.info(data);
            if (error != null || data.rc != 0) {
                log.error(error);
                if(typeof params !== 'undefined' && typeof params.onRecognize === 'function') params.onRecognize(result);
                return;
            }

            let words = data.result.split(" ");
            let words_static = {};
            let result = "";

            for(let i = 0;i < words.length;i++) {
                if(words[i].indexOf("noise") < 0 && words[i].indexOf("<s>") < 0) {
                    result += ((result.length != 0) ? " " : "") + words[i];
                }
            }

            this.recognizerLastResult = result;
            if(typeof params !== 'undefined' && typeof params.onRecognize === 'function') params.onRecognize(result);
        });
    }

    startRecognizeGoogle(params = {}) {
        try {
            if(this.recordStarted) return;

            if(typeof params.waveProgressBar !== 'undefined') this.waveProgressBar = params.waveProgressBar;            
            if(this.wave !== null) this.wave.start();
            if(this.waveProgressBar !== null) this.waveProgressBar.start();

            this.recognizeParams = params;

            this.request = {
                config: {
                    encoding: 'LINEAR16',
                    sampleRateHertz: 16000,
                    languageCode: 'ru-RU',
                },
                interimResults: true,  // возврат промежуточных результатов распознавания
                singleUtterance: true   // непрерывность распознавания из стрима (пауза не сработает из файла)
            };

            this.client = new speech.SpeechClient({
                credentials: {
                    "type": "service_account",
                    "project_id": "sprec-260520",
                    "private_key_id": "418702d73b50b7ce3f76067a5a0109751671d9c7",
                    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQC0phbCebYAZRe2\nOZiXygbLgpfH8rHm0jh+dkKL+WdEuulhQsmzYaLu8ffgOcYb2JQD8VuruUnbB0ie\nE9R/WMHPSh5dt0Qwt+X59MhGyUfe3zDK4KvU9gE9ruAL7AC9RqHOtXwpE8237V9h\n1pTU3a6HOoxssdI3i0yhjzVbVVE1V7o1HP5smmybYGoD3xVbEFH2qY+bLmywD2W8\nURhNvREhgcGIRhlcQYptI+WDEoYw2AC80oiEVZ7jx++YHLcmFzsyxUVgz1Nk437A\nHJRdpUxQ1VDtBofJAXE5sHtGeX6FNxaCLDfglAtfpubLNzjmrjfkMRC8I1+bpKRh\n7dFPEsQDAgMBAAECgf8q+vxAvW6+qU7MaXNZNaDFVnuAi4OZxJkgw19vBYrSQ9Tm\nCVsLUunOTTghCfsBX0Bj3k7aAQ00VXAI5oBitOnzfyNdV1SE/Q2MDfc7mnmtpIP3\nZAjD6E+pF5VOKZK9pG2VTIGD0BsiBMx+TDKRW6FwizfGpLbTxiJG2cvYHbpL3xUb\nsIg1p4WAUFm8vnjMoO+mqc5YcuXbKmx4WAIPqN1MIgC4LPvc/1yDtzQtZLVtrO27\nghbi9VUmqUygz/b42PWF9kivW/J/7rAN69yDm5TWuEQ2NHTC3WDX5whdHT2linXA\nlwtA7SfLricRKEldFlpBbVPsrlptbcehlmP8XRECgYEA89/wyAvoQ9YTwhzRAVDx\nddP1W38PDTTa+Dfj87gXqlmF4HVZ7MOVMaHc20xwdkdZTUuSuXN6sh6ysNb/Leel\n1Zl4lA947YJPeqfuWE9UeVqut1Z3Umb3QCFE1O3tJpzg5OP4nhTBPOLKLeQyhG+g\ntzPxexG/GTCvs2P686l0dM8CgYEAvaFnCbcHWWf/VSf+rgfJnpcDqucWU4BJabLf\nSdsOBksNVv8RVnZdEwMe9UQrthsUgfdv78t/EP2oXgPkyZOshzFSFobNPr2jqHLZ\nw8cvkCE1Dy1qA3jDTRGCVPz+VwCP0sYcYqsWoKi6jUKQNbbRj61ajbE7XswozHDx\nPvaCMo0CgYEA2ndxRnPMRQDAwHJ6FRjCxc/0C1v+StFfm17OGOWAZb0+vf3CaeQn\ngcfDhryqPnraF/EsZm95qZjwcJSZEjFjEL8kElbt+K50rqdDT975CKFgxKJzz+Cn\ne86Rz8G4YY/Fs6Y5cLudBAMSJRw42QT6z0N7/si+DT3dF/HnvGHADmcCgYAYr+6O\nITnftd5T48UQOwtQjjB4C2WosUbdb+AJ6W7F+vddoA9NxlMPqpRZMerO5m+hC+mS\nuldsitlkg/VBGOyZHR6muB34URABWhJnnoLerLQPqcXndc1XNzRUhCtIgFY5Bnmj\njsp/V/gRc9z6YTafEd58G9qy2LlnBD0kCUuh8QKBgQCIx6F8R4XNx04rZkcukUsV\nAJClags415Xb0W9A+afl6m/xXlEMj4gAW77mF/p2Hi5sY+wqpO1Q6Yn2LN8zo6Dl\nhy7dnfeVKPleqUXUVmdw87OG8HpGToNXOUrEG2VSbzZV4203o5CYsuxdyAQQYVSH\ni/BImO7HTZdHT9Fo8o8sNA==\n-----END PRIVATE KEY-----\n",
                    "client_email": "starting-account-h6ls2g932j3e@sprec-260520.iam.gserviceaccount.com",
                    "client_id": "114796192265116842258",
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/starting-account-h6ls2g932j3e%40sprec-260520.iam.gserviceaccount.com"
                }
            });

            const onRecognizedText = (data) => {
                //this.stopRecognizeGoogle();
                const text = ((data.results[0] && data.results[0].alternatives[0]) ? data.results[0].alternatives[0].transcript : "");
                this.processRecognizedText(text);                
            };

            // Create a recognize stream
            this.recognizeStream = this.client
                .streamingRecognize(this.request)
                .on('error', (err) => { 
                    log.error('Error while recognizing stream', err); 
                    this.stopRecognizeGoogle(true); 
                    if(typeof params !== 'undefined' && typeof params.onRecognize === 'function') params.onRecognize(this.recognizerLastResult);
                })
                .on('data', (data) => { onRecognizedText(data); })
                .on('end',(data) => { 
                    if(typeof params !== 'undefined' && typeof params.onRecognize === 'function') params.onRecognize(this.recognizerLastResult);
                }) ;

            let speechThreshold = 0.5;
            const inSpeech = (byteArray) => {
                let res = [];
                let min_value = null;
                let max_value = null;

                let start_i = (byteArray.length >= 4 && byteArray[0] == 82 && byteArray[1] == 73 && byteArray[2] == 70 && byteArray[3] == 70) ? 44 : 0;
                for(let i = start_i;i < byteArray.length;i+=2) {
                    let value = (byteArray[i] | (byteArray[i+1] < 128 ? (byteArray[i+1] << 8) : ((byteArray[i+1] - 256) << 8)))/32768;
                    res.push(value);

                    if(min_value == null || min_value > value) min_value = value;
                    if(max_value == null || max_value < value) max_value = value;

                    if(start_i > 0 && (i == byteArray.length-1 || i == 400)) {
                        speechThreshold = Math.max(Math.abs(min_value*4),Math.abs(max_value*4));
                        if(speechThreshold > 0.8) speechThreshold = 0.8;
                        if(speechThreshold < 0.01) speechThreshold = 0.01;
                    }
                }
                return (min_value < -speechThreshold || max_value > speechThreshold);
            };

            //проверка на долгтй простой голосового распознавания
            if(this.recognizerWorkTimeoutId !== null) clearInterval(this.recognizerWorkTimeoutId);
            this.recognizerWorkTimeoutId = setTimeout(() => {
                this.recognizerWorkTimeoutId = null;
                this.stopRecognizeGoogle();
            },((typeof params.recognizer_interval !== 'undefined') ? params.recognizer_interval : 5000));

            let in_speech = false;
            this.recordStarted = true;
            this.recognizerLastResult = "";
            record
                .start({
                    sampleRateHertz: 16000,
                    threshold: 0.5,
                    //thresholdEnd: 2,
                    // Other options, see https://www.npmjs.com/package/node-record-lpcm16#options
                    verbose: false,
                    recordProgram: 'rec', // Try also "arecord" or "sox"
                    silence: '10.0',
                })
                .on('data',(data) => {
                    try {
                        let currentInSpeech = inSpeech(data);

                        if(currentInSpeech && !in_speech) {
                            in_speech = true;
                            if(data != null && typeof params !== 'undefined' && typeof params.onStartSpeech === 'function') params.onStartSpeech();
                        }

                        if(!currentInSpeech && in_speech) {
                            in_speech = false;
                            if(data != null && typeof params !== 'undefined' && typeof params.onEndSpeech === 'function') params.onEndSpeech();
                            this.stopRecognizeGoogle();
                        }
                    } catch(ex) {
                        log.error(ex);
                    }
                })
                .on('error', (err) => {
                    try {
                        log.info('Errorrecording', err);
                        this.stopRecognizeGoogle();
                        if(typeof params !== 'undefined' && typeof params.onRecognize === 'function') params.onRecognize(this.recognizerLastResult);
                        //if(typeof params !== 'undefined' && typeof params.onEndSpeech === 'function') params.onEndSpeech();                        
                    } catch(ex) {
                        log.error(ex);
                    }
                })
                .on('end', () => {
                    try {
                        log.info('stop recording');
                        this.stopRecognizeGoogle();
                    } catch (ex) {
                        log.error(ex);
                    }
                })
                .pipe(this.recognizeStream);

        } catch(ex) {
            log.error(ex);
        }
    }

    stopRecognizeGoogle(send_result = false) {
        try { 
            if(this.recordStarted) {
                if(this.wave !== null) this.wave.stop();
                if(this.waveProgressBar !== null) this.waveProgressBar.stop();
                this.recordStarted = false;
                record.stop();  
            }
            if(this.recognizerWorkTimeoutId != null) {
                clearTimeout(this.recognizerWorkTimeoutId);
                this.recognizerWorkTimeoutId = null;
            }
        } catch(ex) {
            log.error(ex);
        }
    }

    processRecognizedText(text) {
        this.recognizerLastResult = text;
        if(typeof this.recognizeParams !== 'undefined' && typeof this.recognizeParams.onIntermediateResult === 'function') {
            this.recognizeParams.onIntermediateResult(text); 
        }
    };

    startRecognize(params = {},method=RECOGNIZER_METHOD_GOOGLE) {
        if(this.recordStarted) return;

        this.recognizeParams = params;
        this.recognizeParams.method = method;

        switch (method) {
            case RECOGNIZER_METHOD_GOOGLE: {
                this.startRecognizeGoogle(params);
                break;
            }
            case RECOGNIZER_METHOD_SPHINX: {
                this.startRecognizeSphinx(params);
                break;
            }
            case RECOGNIZER_METHOD_SPHINX_FROM_FILE: {
                this.startRecognizeFromFile(params);
                break;
            }
        }
    }

    stopRecognize(method = null) {
        if(this.recognizeParams == null) return;
        switch(method || this.recognizeParams.method) {
            case RECOGNIZER_METHOD_GOOGLE: {
                this.stopRecognizeGoogle(this.recognizeParams);
                break;
            }
            case RECOGNIZER_METHOD_SPHINX: {
                this.stopRecognizeSphinx(this.recognizeParams);
                break;
            }
            case RECOGNIZER_METHOD_SPHINX_FROM_FILE: {
                this.stopRecognizeFromFile(this.recognizeParams);
                break;
            }
        }
    }

    testModeInit() {
        try {
            let dicFileName = path.resolve(path.join(homedir,"models/zero_ru_cont_8k_v3/ru.dic"));
            let dic_content = fs.readFileSync(dicFileName, 'utf8');
            let result = {};

            let lines = dic_content.split(/\r?\n/);
            for(let i = 0;i < lines.length;i++) {
                let phonems = lines[i].split(/\s/);
                if(phonems.length < 2) continue;

                let word = phonems.shift();
                let chr_index = word.indexOf("(");
                if(chr_index > 0) word = word.slice(0,chr_index);

                if(typeof result[word] === 'undefined') result[word] = [];
                result[word].push(phonems.join(" "));
            }

            this.testModeParams.dic = result;
            this.testModeParams.dic_index = [];
            this.testModeParams.current_word_index = 0;
            for(let key in result) if(this.testModeParams.dic_index.indexOf(key) < 0) this.testModeParams.dic_index.push(key);
            this.testModeParams.prev_word_index = this.testModeParams.dic_index.length-1;

            this.testModeSetWord(0);

            let recognizer_test_mode = document.getElementById("recognizer_test_mode-cnt");
            recognizer_test_mode.style.display = "none";

            let next_word_elem = document.getElementById("recognizer_test_mode-next_word");
            let prev_word_elem = document.getElementById("recognizer_test_mode-prev_word");
            let word_ok_elem = document.getElementById("recognizer_test_mode-word_ok");
            let word_fail_elem = document.getElementById("recognizer_test_mode-word_fail");

            if(next_word_elem) {
                next_word_elem.removeEventListener("click",() => { this.testModeOnNextWord() });
                next_word_elem.addEventListener("click",() => { this.testModeOnNextWord() });
            }

            if(prev_word_elem) {
                prev_word_elem.removeEventListener("click",() => { this.testModeOnPrevWord() });
                prev_word_elem.addEventListener("click",() => { this.testModeOnPrevWord() });
            }

            if(word_ok_elem) {
                word_ok_elem.removeEventListener("click",() => { this.testModeOnWordOk() });
                word_ok_elem.addEventListener("click",() => { this.testModeOnWordOk() });
            }

            if(word_fail_elem) {
                word_fail_elem.removeEventListener("click",() => { this.testModeOnWordFail() });
                word_fail_elem.addEventListener("click",() => { this.testModeOnWordFail() });
            }


            function onButtonClick(event) {
                if(event.ctrlKey && event.shiftKey && event.code === "KeyT") {
                    let recognizer_test_mode = document.getElementById("recognizer_test_mode-cnt");
                    if(recognizer_test_mode.style.display == "block") {
                        recognizer_test_mode.style.display = "none";
                    } else {
                        recognizer_test_mode.style.display = "block";
                    }
                }
            }

            document.removeEventListener("keydown",onButtonClick);
            document.addEventListener("keydown",onButtonClick);
        }  catch(ex) {
            log.error(ex);
        }
    }

    testModeSetWord(index = null) {
        if(index == null) index = this.testModeParams.current_word_index;
        else this.testModeParams.current_word_index = index;
        let word = this.testModeParams.dic_index[index];

        let result = this.getTestModeResult();
        let word_ok = 0;
        let word_fail = 0;
        if(typeof result[word] !== 'undefined') {
            word_ok = result[word].word_ok;
            word_fail = result[word].word_fail;
        }

        let word_ok_elem = document.getElementById("recognizer_test_mode-word_ok_status");
        let word_fail_elem = document.getElementById("recognizer_test_mode-word_fail_status");
        word_ok_elem.innerHTML = word_ok;
        word_fail_elem.innerHTML = word_fail;

        let word_elem = document.getElementById("recognizer_test_mode-word");
        word_elem.innerHTML ='<div style="text-align: center;font-size: 14pt;font-weight: bold;">' + word + '</div>';
        this.testModeParams.dic[word].forEach(function(value,index) {
            word_elem.innerHTML +='<div style="text-align: left;padding-left: 10px;">' + index + ": " + value + '</div>';
        });
    }

    testModeOnNextWord() {
        let randomizeCheckbox = document.getElementById("recognizer_test_mode-randomize");
        this.testModeParams.prev_word_index = this.testModeParams.current_word_index;
        if(randomizeCheckbox.checked) this.testModeParams.current_word_index = Math.floor(Math.random()*this.testModeParams.dic_index.length);
        else this.testModeParams.current_word_index++;
        if(this.testModeParams.current_word_index >= this.testModeParams.dic_index.length) this.testModeParams.current_word_index = 0;
        if(this.testModeParams.current_word_index < 0) this.testModeParams.current_word_index = this.testModeParams.dic_index.length-1;

        this.testModeSetWord();
    }

    testModeOnPrevWord() {
        if(this.testModeParams.current_word_index == this.testModeParams.prev_word_index) this.testModeParams.current_word_index--;
        else this.testModeParams.current_word_index = this.testModeParams.prev_word_index;
        if(this.testModeParams.current_word_index >= this.testModeParams.dic_index.length) this.testModeParams.current_word_index = 0;
        if(this.testModeParams.current_word_index < 0) this.testModeParams.current_word_index = this.testModeParams.dic_index.length-1;

        this.testModeSetWord();
    }

    testModeOnWordOk() {
        this.changeTestModeResultFile(1);
        this.testModeSetWord();
    }

    testModeOnWordFail() {
        this.changeTestModeResultFile(2);
        this.testModeSetWord();
    }

    changeTestModeResultFile(action) {
        try {
            let result = {};

            let file_name = "./recognizer-test.json";
            if(fs.existsSync(file_name)) {
                let data = fs.readFileSync(file_name,'utf8');
                if(data == null) {
                    log.error("Error read config file: " + file_name);
                    return;
                }
                result = JSON.parse(data);
            }

            let word = this.testModeParams.dic_index[this.testModeParams.current_word_index];
            if(typeof result[word] === 'undefined') result[word] = {
                word_ok: 0,
                word_fail: 0,
                hyp_list: []
            };

            switch (action) {
                case 1:  {
                    result[word].word_ok++;
                    result[word].hyp_list.push(this.recognizerLastResult);
                    break;
                }
                case 2:  {
                    result[word].word_fail++;
                    result[word].hyp_list.push(this.recognizerLastResult);
                    break;
                }
            }

            let content = JSON.stringify(result,null,'\t');
            log.info(file_name);
            fs.writeFileSync(file_name,content,'utf8');
        } catch(ex) {
            log.error(ex);
        }
    }

    getTestModeResult() {
        try {
            let result = {};

            let file_name = "./recognizer-test.json";
            if(fs.existsSync(file_name)) {
                let data = fs.readFileSync(file_name,'utf8');
                if(data == null) {
                    log.error("Error read config file: " + file_name);
                    return;
                }
                result = JSON.parse(data);
            }

            return result;
        } catch(ex) {
            log.error(ex);
            return {};
        }
    }
}