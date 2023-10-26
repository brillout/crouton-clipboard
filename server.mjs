import { WebSocketServer } from 'ws'
import fs from 'fs'
import net from 'net'
import path from 'path'
import url from 'url'
import os from 'os'
import { createLogger, getTime } from './common.mjs'
const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const PORT = 3396
const dataFile = ensureFile('./data/clipboard.txt')
const logsFile = ensureFile('./data/logs.txt')
const pid = getTime()
const log = createLogger(pid, writeLog)

log('[startup]')

assertLocation()

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
    fs.watchFile(dataFile, { interval: 700 }, () => {
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

function ensureFile(filePath) {
  const filePathAbsolute = path.join(__dirname, filePath)
  fs.mkdirSync(path.dirname(filePathAbsolute), { recursive: true })
  if (!fs.existsSync(filePathAbsolute)) fs.writeFileSync(filePathAbsolute, '')
  return filePathAbsolute
}

function assertLocation() {
  const __dirname_expected = os.homedir() + '/Downloads/.crouton-clipboard'
  if (__dirname !== __dirname_expected) {
    throw new Error(
      [
        //
        'Wrong location.',
        `__dirname:\n  ${__dirname}`,
        `__dirname_expected:\n  ${__dirname_expected}`
      ].join('\n')
    )
  }
}

function writeLog(...msgs) {
  fs.appendFileSync(logsFile, msgs.join(' ') + '\n')
}
