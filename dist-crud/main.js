const path = require('path')
const { app, BrowserWindow, ipcMain } = require('electron')
const fs = require('fs')
require('electron-reload')(__dirname)

const PATH_TO_JSON = './json/todo.json'

ipcMain.on('getJson', (event, arg) => {
  const json = getTodoContents()
  event.reply('getJson-reply', json)
})

ipcMain.on('add', (event, key, name) => {
  const todo = getTodoContents()
  todo.todolist.splice(key, 0, name || "keyName-"+todo.todolist.length)
  setTodoContents(event, todo)
})

ipcMain.on('edit', (event, key, name) => {
  const todo = getTodoContents()
  todo.todolist.splice(key, 1, name || "keyName-"+Math.floor(Math.random() * 10))
  setTodoContents(event, todo)
})

ipcMain.on('remove', (event, key) => {
  const todo = getTodoContents()
  todo.todolist.splice(key, 1)
  setTodoContents(event, todo)
})

function getTodoContents(){
  const json = fs.readFileSync(PATH_TO_JSON, 'utf8')
  return JSON.parse(json)
}

function setTodoContents(event, todo){
  const json = JSON.stringify(todo)
  fs.writeFileSync(PATH_TO_JSON, json)
  event.reply('getJson-reply', todo)
}

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
