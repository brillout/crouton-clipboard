import { createLogger, getTime } from './common.mjs'
const pid = getTime()
const log = createLogger(pid)
const PORT = 3396

log('[startup]')

chrome.runtime.onMessage.addListener(onMsg)

var ws = new WebSocket('ws://localhost:' + PORT)
createListener(ws)
var timeout

function onMsg(msg) {
  log('chrome.runtime.onMessage', msg)
  if (msg.event === 'copy') {
    if (timeout) {
      clearTimeout(timeout)
      timeout = null
    }
    if (~[2, 3].indexOf(ws.readyState)) {
      timeout = setTimeout(() => {
        ws = new WebSocket('ws://localhost:' + PORT)
        createListener(ws)
        ws.onopen = () => {
          log('[WebSocket][send]', msg.data)
          ws.send(msg.data)
        }
      }, 300)
    } else {
      log('[WebSocket][send]', msg.data)
      ws.send(msg.data)
    }
  }
}

function createListener(ws) {
  ws.onmessage = (msg) => {
    log('[WebSocket][message received]')
    const { data } = msg
    if (!(data instanceof Blob)) throw new Error('Unpexted message payload')
    const reader = new FileReader()
    reader.onload = () => copyTextToClipboard(reader.result)
    reader.readAsText(data)
  }
}

function copyTextToClipboard(text) {
  log('[copyTextToClipboard]', text)
  var textArea = document.createElement('textarea')
  textArea.style.position = 'fixed'
  textArea.style.top = 0
  textArea.style.left = 0
  textArea.style.width = '2em'
  textArea.style.height = '2em'
  textArea.style.padding = 0
  textArea.style.border = 'none'
  textArea.style.outline = 'none'
  textArea.style.boxShadow = 'none'
  textArea.style.background = 'transparent'
  textArea.value = text
  document.body.appendChild(textArea)
  textArea.select()
  try {
    var successful = document.execCommand('copy')
    var msg = successful ? 'SUCCESSFUL' : 'UNSUCCESSFUL'
    log('[copyTextToClipboard] Copying text command was ' + msg)
  } catch (err) {
    log('[copyTextToClipboard] Oops, unable to copy')
  }
  document.body.removeChild(textArea)
}
