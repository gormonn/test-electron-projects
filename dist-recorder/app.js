// const { ipcRenderer } = require('electron')
// const speech = require('../node_modules/nodejs-speech/build/src/v1/index.js')
const Recorder = require('./recorder')
// const Speech = require('./speech1')
const speech = require('@google-cloud/speech')
const {GoogleAuth} = require('google-auth-library');

// const { googleSpeechMakeRequest } = require('./GoogleSpeechClientBundle')
const apiKey = 'AIzaSyDUazcuAzPVLh2ExxdphPlx4HeMk51HnfQ'
const GSpeech = new Speech({apiKey})
// console.log({Speech})

// const snowboy = require('snowboy')
// const {Detector, Models} = snowboy;
// const detector = new Detector()

const { log } = console

// const porcupine = require('porcupine')
// log(porcupine)

// const VAD = require("webrtcvad").default
// const vad = new VAD(16000, 0)

//webkitURL is deprecated but nevertheless
URL = window.URL || window.webkitURL;

var gumStream; 						//stream from getUserMedia()
var rec; 							//Recorder.js object
var input; 							//MediaStreamAudioSourceNode we'll be recording

// shim for AudioContext when it's not avb. 
var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext //audio context to help us record

var resultField = document.getElementById("result");
var recordButton = document.getElementById("recordButton");
var stopButton = document.getElementById("stopButton");
var pauseButton = document.getElementById("pauseButton");

//add events to those 2 buttons
recordButton.addEventListener("click", startRecording);
stopButton.addEventListener("click", stopRecording);
pauseButton.addEventListener("click", pauseRecording);

// const apiKey = 'REDACTED'; 
// const googleAuth = new GoogleAuth();
// const auth = googleAuth.fromAPIKey(apiKey);

function googleSpeechMakeRequest1(audioBytes) { 
	try{
	//   Creates a client
		// const client = new speech.v1p1beta1.SpeechClient({
		// window = undefined
		const client1 = new speech.v1.SpeechClient({
			// fallback: false,
			// auth,
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

		// The audio file's encoding, sample rate in hertz, and BCP-47 language code
		const audio = {
			content: audioBytes,
		};
		const config = {
			encoding: 'LINEAR16',
			sampleRateHertz: 48000, // желательно указать корректное значение
			languageCode: 'ru-RU',
		};
		const request = {
			audio,
			config,
			// interimResults: true,  // возврат промежуточных результатов распознавания
			// singleUtterance: true   // непрерывность распознавания из стрима (пауза не сработает из файла)
		};

		log(client.recognize)
		// Detects speech in the audio file
		
		debugger;
		const [response] = client.recognize(request);
		debugger;
		//   console.log('recognize res', response);
		return response;
	}catch(err){
	  console.error(err)
	}
  }

function startRecording() {
	console.log("recordButton clicked");

	/*
		Simple constraints object, for more advanced audio features see
		https://addpipe.com/blog/audio-constraints-getusermedia/
	*/
    
    var constraints = { audio: true, video:false }

 	/*
    	Disable the record button until we get a success or fail from getUserMedia() 
	*/

	recordButton.disabled = true;
	stopButton.disabled = false;
	pauseButton.disabled = false

	/*
    	We're using the standard promise based getUserMedia() 
    	https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
	*/

	navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
		console.log("getUserMedia() success, stream created, initializing Recorder.js ...");

		/*
			create an audio context after getUserMedia is called
			sampleRate might change after getUserMedia is called, like it does on macOS when recording through AirPods
			the sampleRate defaults to the one set in your OS for your playback device

		*/
		audioContext = new AudioContext();

		//update the format 
		document.getElementById("formats").innerHTML="Format: 1 channel pcm @ "+audioContext.sampleRate/1000+"kHz"

		/*  assign to gumStream for later use  */
		gumStream = stream;
		
		/* use the stream */
		input = audioContext.createMediaStreamSource(stream);
		// const vaded = vad.process(buffer)
		// log({buffer, vaded})
		// log({stream, input})
		stream.onaddtrack = function(e){
			log('onaddtrack', e)
		}

		/* 
			Create the Recorder object and configure to record mono sound (1 channel)
			Recording 2 channels  will double the file size
		*/
		rec = new Recorder(input,{numChannels:1})

		//start the recording process
		rec.record()

		console.log("Recording started");

	}).catch(function(err) {
	  	//enable the record button if getUserMedia() fails
    	recordButton.disabled = false;
    	stopButton.disabled = true;
    	pauseButton.disabled = true
	});
}

function pauseRecording(){
	console.log("pauseButton clicked rec.recording=",rec.recording );
	if (rec.recording){
		//pause
		rec.stop();
		pauseButton.innerHTML="Resume";
	}else{
		//resume
		rec.record()
		pauseButton.innerHTML="Pause";

	}
}

function stopRecording() {
	console.log("stopButton clicked");

	//disable the stop button, enable the record too allow for new recordings
	stopButton.disabled = true;
	recordButton.disabled = false;
	pauseButton.disabled = true;

	//reset button just in case the recording is stopped while paused
	pauseButton.innerHTML="Pause";
	
	//tell the recorder to stop the recording
	rec.stop();

	//stop microphone access
	gumStream.getAudioTracks()[0].stop();

	//create the wav blob and pass it on to createDownloadLink
	// rec.exportWAV(createDownloadLink);
	rec.exportWAV(googleSpeechReq);
}

// todo остановить запись после начала через 3 секунды
// ipcRenderer.on('googleSpeechRes', googleSpeechRes)

function googleSpeechRes(e, data){
	console.log('googleSpeechRes', e, data);
	resultField.innerText = JSON.stringify(data, '  ')
}

function googleSpeechReq(blob) {
    let reader = new FileReader()
    reader.onload = async function() {
        if (reader.readyState == 2) {
			const buffer = new Buffer(reader.result)
			// const buffer = Buffer.from(reader.result)
			// const vaded = vad.process(buffer)
			// log({buffer, vaded})
			console.log(`Отправка записанной речи в Google Speech`)
			// debugger;
			// const result = googleSpeechMakeRequest(buffer)
			const result = await GSpeech.recognize(buffer)
            // ipcRenderer.send('googleSpeechReq', buffer)
            console.log(`Получен ответ распознавания`, result)
        }
    }
    reader.readAsArrayBuffer(blob)
}

// function createDownloadLink(blob) {
	
// 	var url = URL.createObjectURL(blob);
// 	var au = document.createElement('audio');
// 	var li = document.createElement('li');
// 	var link = document.createElement('a');

// 	//name of .wav file to use during upload and download (without extendion)
// 	var filename = new Date().toISOString();

// 	//add controls to the <audio> element
// 	au.controls = true;
// 	au.src = url;

// 	//save to disk link
// 	link.href = url;
// 	link.download = filename+".wav"; //download forces the browser to donwload the file using the  filename
// 	link.innerHTML = "Save to disk";

// 	//add the new audio element to li
// 	li.appendChild(au);
	
// 	//add the filename to the li
// 	li.appendChild(document.createTextNode(filename+".wav "))

// 	//add the save to disk link to li
// 	li.appendChild(link);
	
// 	//upload link
// 	var upload = document.createElement('a');
// 	upload.href="#";
// 	upload.innerHTML = "Upload";
// 	upload.addEventListener("click", function(event){
// 		  var xhr=new XMLHttpRequest();
// 		  xhr.onload=function(e) {
// 		      if(this.readyState === 4) {
// 		          console.log("Server returned: ",e.target.responseText);
// 		      }
// 		  };
// 		  var fd=new FormData();
// 		  fd.append("audio_data",blob, filename);
// 		  xhr.open("POST","upload.php",true);
// 		  xhr.send(fd);
// 	})
// 	li.appendChild(document.createTextNode (" "))//add a space in between
// 	li.appendChild(upload)//add the upload link to li

// 	//add the li element to the ol
// 	recordingsList.appendChild(li);
// }