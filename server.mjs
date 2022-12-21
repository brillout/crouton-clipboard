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
    console.log(__dirname)
    console.log(__dirname_expected)
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
    ws.on('message', (msg) => {
      console.log('message', msg.toString())
      fs.writeFile(dataFile, msg, () => {})
    })
    fs.watchFile(dataFile, () => {
      const clipboardData = fs.readFileSync(dataFile)
      console.log('send', clipboardData.toString())
      ws.send(clipboardData)
    })
    ws.on('close', () => fs.unwatchFile(dataFile))
  })
  console.log('Listening on ' + PORT)
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
