const path = require('path')
const { app, BrowserWindow, ipcMain } = require('electron')
const speech = require('@google-cloud/speech');
const Flac = require('libflacjs')()
const fs = require('fs')
// require('electron-reload')(__dirname)

async function main2() {
  // Imports the Google Cloud client library
  const speech = require('@google-cloud/speech');
  const fs = require('fs');

  // Creates a client
  const client = new speech.SpeechClient({
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

  // The name of the audio file to transcribe
  const fileName = './dist/sound/test.wav';

  // Reads a local audio file and converts it to base64
  const file = fs.readFileSync(fileName);
  const audioBytes = file.toString('base64');

  // The audio file's encoding, sample rate in hertz, and BCP-47 language code
  const audio = {
    content: audioBytes,
  };
  const config = {
    encoding: 'LINEAR16',
    sampleRateHertz: 48000,
    languageCode: 'ru-RU',
  };
  const request = {
    audio: audio,
    config: config,
  };

  // Detects speech in the audio file
  const [response] = await client.recognize(request);
  const transcription = response.results
    .map(result => result.alternatives[0].transcript)
    .join('\n');
  console.log(`Transcription: ${transcription}`);
}
// main2().catch(console.error);

async function googleSpeechMakeRequest(base64) { 
  try{
    

    // Creates a client
    const client = new speech.SpeechClient({
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
  
  // The name of the audio file to transcribe
  const fileName = './dist/sound/test.wav';
  const file = fs.readFileSync(fileName);
  const audioBytes = file.toString('base64');

  // const audioBytes = base64.split(',')[1]
  // fs.writeFileSync('./dist/sound/sound.webm', base64)

    // console.log(audioBytes)
    // The audio file's encoding, sample rate in hertz, and BCP-47 language code
    const audio = {
      content: audioBytes,
    };
    const config = {
      encoding: 'LINEAR16',
      // encoding: 'SPEEX_WITH_HEADER_BYTE',
      sampleRateHertz: 48000, // определяется в нашем коде фронта (audioBitsPerSecond)
      languageCode: 'ru-RU',
    };
    const request = {
      audio: audio,
      config: config,
    };
  
    // Detects speech in the audio file
    const [response] = await client.recognize(request);
    // const transcription = response.results
    //   .map(result => result.alternatives[0].transcript)
    //   .join('\n');
    // const result = `Transcription: ${transcription}`;
    // console.log(result);
    console.log('recognize res', response);
    return response;
  }catch(err){
    console.log('err',err,'err')
  }
}
// main().catch(console.error);

ipcMain.on('googleSpeechReq', async (event, base64Content) => {
  // console.log('googleSpeechReq', base64Content)
  const googleAnswer = await googleSpeechMakeRequest(base64Content)
  // const googleAnswer = 'azaza'
  event.reply('googleSpeechRes', googleAnswer)
})


// const PATH_TO_JSON = './json/todo.json'

// ipcMain.on('getJson', (event, arg) => {
//   const json = getTodoContents()
//   event.reply('getJson-reply', json)
// })

// ipcMain.on('add', (event, key, name) => {
//   const todo = getTodoContents()
//   todo.todolist.splice(key, 0, name || "keyName-"+todo.todolist.length)
//   setTodoContents(event, todo)
// })

// ipcMain.on('edit', (event, key, name) => {
//   const todo = getTodoContents()
//   todo.todolist.splice(key, 1, name || "keyName-"+Math.floor(Math.random() * 10))
//   setTodoContents(event, todo)
// })

// ipcMain.on('remove', (event, key) => {
//   const todo = getTodoContents()
//   todo.todolist.splice(key, 1)
//   setTodoContents(event, todo)
// })

// function getTodoContents(){
//   const json = fs.readFileSync(PATH_TO_JSON, 'utf8')
//   return JSON.parse(json)
// }

// function setTodoContents(event, todo){
//   const json = JSON.stringify(todo)
//   fs.writeFileSync(PATH_TO_JSON, json)
//   event.reply('getJson-reply', todo)
// }

function createWindow () {
  // Создаем окно браузера.
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  })

  // and load the index.html of the app.
  win.loadFile('./dist/index.html')
  // win.loadFile('todo.json')

  // Отображаем средства разработчика.
  win.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Некоторые API могут использоваться только после возникновения этого события.
app.whenReady().then(createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // Для приложений и строки меню в macOS является обычным делом оставаться
  // активными до тех пор, пока пользователь не выйдет окончательно используя Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
   // На MacOS обычно пересоздают окно в приложении,
   // после того, как на иконку в доке нажали и других открытых окон нету.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. Можно также поместить их в отдельные файлы и применить к ним require.
