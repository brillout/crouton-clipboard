chrome.runtime.onMessage.addListener(onMsg)
var PORT = 3396

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
    if (msg.data instanceof Blob) reader = new FileReader()
    reader.onload = () => copyTextToClipboard(reader.result)
    reader.readAsText(msg.data)
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

function log(msg, ...msgs) {
  msg = formatFirstMsg(msg)
  msg = formatMsg(msg)
  Object.keys(msgs).forEach((i) => {
    msgs[i] = formatMsg(msgs[i])
  })
  console.log(`[${new Date().toLocaleTimeString()}]${msg}`, ...msgs)
}
function formatFirstMsg(msg) {
  if (typeof msg !== 'string') return msg
  if (!msg.startsWith('[') && !msg.startsWith(' ')) msg = ' ' + msg
  return msg
}
function formatMsg(msg) {
  if (typeof msg !== 'string') return msg
  msg = msg.split(/\s/).join(' ')
  if (msg.length > 100) msg = msg.slice(0, 100) + '...'
  return msg
}
