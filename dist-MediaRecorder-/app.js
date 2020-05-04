const { ipcRenderer } = require('electron')
const Recorder = require('./recorder')
const { log } = console

const mimeType = 'audio/webm'
// const mimeType = 'audio/x-speex-with-header-byte'

// todo остановить запись после начала через 3 секунды
ipcRenderer.on('googleSpeechRes', googleSpeechRes)

// отправляем 
function googleSpeechReq(base64Content){
  // log('base64Content',base64Content)
  ipcRenderer.send('googleSpeechReq', base64Content);
  // googleSpeechMakeRequest(base64Content)
}

function googleSpeechRes(e, data){
  log('googleSpeechRes', e, data);
}

function readBlobAsync(blob) {
  return new Promise((resolve, reject) => {
    let reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result;//.split(',')[1];
      log(reader.result.split(',')[0])
      resolve(base64data);
      // const file = fs.readFileSync(fileName);
      // const audioBytes = file.toString('base64');
    }
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  })
}

async function blob2Base64(blob) {
  try {
    let base64data = await readBlobAsync(blob);
    return base64data
  } catch (err) {
    console.log('blob2Base64', err);
  }
}





// set up basic variables for app

const record = document.querySelector('.record');
const stop = document.querySelector('.stop');
const soundClips = document.querySelector('.sound-clips');
const canvas = document.querySelector('.visualizer');
const mainSection = document.querySelector('.main-controls');

// disable stop button while not recording
stop.disabled = true;

// visualiser setup - create web audio api context and canvas
let audioCtx;
const canvasCtx = canvas.getContext("2d");


//main block for doing the audio recording
if (navigator.mediaDevices.getUserMedia) {
  console.log('getUserMedia supported.');

  const constraints = { audio: true, video:false };
  let chunks = [];

  let onSuccess = function(stream) {
    // обязательно знать audioBitsPerSecond - чтобы передать в гугл
    const options = {
      audioBitsPerSecond: 16000,
      // mimeType: 'audio/webm;codecs=opus'
      // mimeType: 'x-speex-with-header-byte'
      mimeType
    }
    const mediaRecorder = new MediaRecorder(stream, options);

    log('mime', mediaRecorder.mimeType)

    visualize(stream);

    record.onclick = function() {
      mediaRecorder.start();
      console.log(mediaRecorder.state);
      console.log("recorder started");
      record.style.background = "red";

      stop.disabled = false;
      record.disabled = true;
    }

    stop.onclick = function() {
      mediaRecorder.stop();
      console.log(mediaRecorder.state);
      console.log("recorder stopped");
      record.style.background = "";
      record.style.color = "";
      // mediaRecorder.requestData();

      stop.disabled = true;
      record.disabled = false;
    }

    mediaRecorder.ondataavailable = async function(e) {
      // chunks.push(e.data);
      // console.log('chunks',chunks)
      // googleSpeechRequest(e.data)
      // base64Content

      ///!!!
      // const blob = new Blob([e.data], { 'type' : 'audio/ogg;codecs=opus' });
      const blob = new Blob([e.data], { 'type' : mimeType });
      const audioURL = window.URL.createObjectURL(blob);
      console.log({audioURL})
      // const blob = new Blob([e.data]);
      const base64Content = await blob2Base64(blob)
      googleSpeechReq(base64Content)
    }

    mediaRecorder.onstop = function(e){
      // log('stop', e)
      // chunks
    }

    // mediaRecorder1.onstop = function(e) {
    //   console.log("data available after MediaRecorder.stop() called.");

    //   const clipName = prompt('Enter a name for your sound clip?','My unnamed clip');

    //   const clipContainer = document.createElement('article');
    //   const clipLabel = document.createElement('p');
    //   const audio = document.createElement('audio');
    //   const deleteButton = document.createElement('button');

    //   clipContainer.classList.add('clip');
    //   audio.setAttribute('controls', '');
    //   deleteButton.textContent = 'Delete';
    //   deleteButton.className = 'delete';

    //   if(clipName === null) {
    //     clipLabel.textContent = 'My unnamed clip';
    //   } else {
    //     clipLabel.textContent = clipName;
    //   }

    //   clipContainer.appendChild(audio);
    //   clipContainer.appendChild(clipLabel);
    //   clipContainer.appendChild(deleteButton);
    //   soundClips.appendChild(clipContainer);

    //   audio.controls = true;ogg
    //   const blob = new Blob(chunks, { 'type' : 'audio/ogg; codecs=opus' });
    //   chunks = [];
    //   const audioURL = window.URL.createObjectURL(blob);
    //   audio.src = audioURL;
    //   console.log("recorder stopped");

    //   deleteButton.onclick = function(e) {
    //     let evtTgt = e.target;
    //     evtTgt.parentNode.parentNode.removeChild(evtTgt.parentNode);
    //   }

    //   clipLabel.onclick = function() {
    //     const existingName = clipLabel.textContent;
    //     const newClipName = prompt('Enter a new name for your sound clip?');
    //     if(newClipName === null) {
    //       clipLabel.textContent = existingName;
    //     } else {
    //       clipLabel.textContent = newClipName;
    //     }
    //   }
    // }
  }

  let onError = function(err) {
    console.log('The following error occured: ' + err);
  }

  navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, onError);

} else {
   console.log('getUserMedia not supported on your browser!');
}

function visualize(stream) {
  if(!audioCtx) {
    audioCtx = new AudioContext();
  }

  const source = audioCtx.createMediaStreamSource(stream);

  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  source.connect(analyser);
  //analyser.connect(audioCtx.destination);

  draw()

  function draw() {
    WIDTH = canvas.width
    HEIGHT = canvas.height;

    requestAnimationFrame(draw);

    analyser.getByteTimeDomainData(dataArray);

    canvasCtx.fillStyle = 'rgb(200, 200, 200)';
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

    canvasCtx.beginPath();

    let sliceWidth = WIDTH * 1.0 / bufferLength;
    let x = 0;


    for(let i = 0; i < bufferLength; i++) {

      let v = dataArray[i] / 128.0;
      let y = v * HEIGHT/2;

      if(i === 0) {
        canvasCtx.moveTo(x, y);
      } else {
        canvasCtx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    canvasCtx.lineTo(canvas.width, canvas.height/2);
    canvasCtx.stroke();

  }
}

window.onresize = function() {
  canvas.width = mainSection.offsetWidth;
}

window.onresize();
