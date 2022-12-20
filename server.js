var PORT = 3396
isPortTaken(PORT, startServer)

function startServer() {
  var WebSocketServer = require('ws').Server
  , wss = new WebSocketServer({port: PORT})
  , fs = require('fs')
  , os = require('os')
  var dataFile = os.homedir() + '/.crouton-clipboard/data.txt'
  wss.on('connection', ws => {
    ws.on('message', msg => {
      fs.writeFile(dataFile, msg, () => {})
    })
    fs.watchFile(dataFile, () => {
      ws.send(fs.readFileSync(dataFile))
    })
    ws.on('close', ()=> fs.unwatchFile(dataFile))
  })
  console.log("Listening on "+PORT)
}

function isPortTaken (port, fn) {
  var net = require('net')
  var tester = net.createServer()
  .once('error', function (err) {
    if (err.code != 'EADDRINUSE') return fn()
    process.exit(0)
  })
  .once('listening', function() {
    tester.once('close', function() { fn(null, false) })
    .close()
  })
  .listen(port)
}
