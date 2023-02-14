export { createLogger }
export { getTime }

function getTime() {
  return new Date().toLocaleTimeString('en-GB')
}

function createLogger(pid, onLog) {
  return (...msgs) => log(pid, onLog, ...msgs)
}

function log(pid, onLog, msg, ...msgs) {
  msg = formatFirstMsg(msg)
  msg = formatMsg(msg)
  Object.keys(msgs).forEach((i) => {
    msgs[i] = formatMsg(msgs[i])
  })
  const args = [`[pid:${pid}][${getTime()}]${msg}`, ...msgs]
  console.log(...args)
  if (onLog) onLog(...args)
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
