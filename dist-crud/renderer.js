// console.log(process)
// В renderer процессе (web страница).
const { ipcRenderer } = require('electron')
const {log} = console

ipcRenderer.send('getJson');
ipcRenderer.on('getJson-reply', (event, todoObj) => {
    renderTodo(todoObj);
})

document.getElementById('action-add').onsubmit = function(e){
    e.preventDefault()
    const name = getName()
    ipcRenderer.send('add', 0, name)
}

window.onclick = function(e){
    const {action, key} = e.target.dataset
    const name = getName()
    switch(action){
        // case 'add':
        //     log('Добавить',key);
        //     break;
        case 'edit':
            ipcRenderer.send(action, key, name);
            break;
        case 'remove':
            ipcRenderer.send(action, key);
            break;
        default:
            return;
    }
}

const getName = () => document.getElementById('name').value

const Btn = (action, key) => {
    const btn = document.createElement('button')
    btn.dataset.action = action
    btn.dataset.key = key
    // btn.textContent = action
    btn.className = `todolist__item-action-${action}`
    return btn
}
const Controls = key => {
    const controls = document.createElement('div')
    controls.appendChild(Btn('edit', key))
    controls.appendChild(Btn('remove', key))
    return controls
}

function renderTodo(obj){
    const {todolist} = obj;
    const ul = document.createElement('ul')
    ul.className = `todolist`
    todolist.map((item, key) => {
        const li = document.createElement('li')
        li.className = `todolist__item`
        const text = document.createElement('span')
        text.textContent = item
        li.append(text)
        li.appendChild(Controls(key))
        ul.appendChild(li)
    })
    document.getElementById('todolist').innerHTML = "";
    document.getElementById('todolist').append(ul);
}