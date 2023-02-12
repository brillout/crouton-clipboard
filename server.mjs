import { WebSocketServer } from 'ws'
import fs from 'fs'
import net from 'net'
import path from 'path'
import url from 'url'
import os from 'os'
const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

{
  const __dirname_expected = os.homedir() + '/Downloads/.crouton-clipboard'
  if (__dirname !== __dirname_expected) {
    log(__dirname)
    log(__dirname_expected)
    throw new Error('Wrong location')
  }
}

const PORT = 3396
const dataFile = path.join(__dirname, './clipboard-data.txt')
if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, '\n')

isPortTaken(PORT, startServer)

function startServer() {
  const wss = new WebSocketServer({ port: PORT })
  wss.on('connection', (ws) => {
    log('[WebSocket] Connection established.')
    ws.on('message', (msg) => {
      log('[WebSocket][message received]', msg.toString())
      fs.writeFileSync(dataFile, msg)
      log(`[${dataFile}][written]`, msg.toString())
    })
    fs.watchFile(dataFile, () => {
      const clipboardData = fs.readFileSync(dataFile)
      log(`[${dataFile}][changed]`, clipboardData.toString())
      ws.send(clipboardData)
      log('[WebSocket][send]', clipboardData.toString())
    })
    ws.on('close', () => fs.unwatchFile(dataFile))
  })
  log('[WebSocket] Listening on ' + PORT + ', waiting connection to establish...')
}

function isPortTaken(port, fn) {
  var tester = net
    .createServer()
    .once('error', function (err) {
      if (err.code != 'EADDRINUSE') return fn()
      process.exit(0)
    })
    .once('listening', function () {
      tester
        .once('close', function () {
          fn(null, false)
        })
        .close()
    })
    .listen(port)
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
