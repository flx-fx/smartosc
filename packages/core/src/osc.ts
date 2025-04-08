// @ts-expect-error
import osc from 'osc'
import { config } from './config.js'
import { log } from './utils.js'
import { getFaders, setFaders } from './fader-profiles.js'
import { io } from './server.js'

let tcp: any = null

function openTCPSocket() {
  tcp = new osc.TCPSocketPort({
    localAddress: config.tcp.localAddress,
    localPort: config.tcp.localPort,
  })

  tcp.on('error', (error: Error) => {
    log(`OSC TCP error: ${error.message}`, 'error')
    io.emit('error-t', error)
    config.tcp.input = false
    config.tcp.output = false
    closeTCPSocket()
  })

  if (config.tcp.input) {
    tcp.on('message', handleOSCMessage)
  }

  if (config.tcp.output) {
    tcp.on('ready', () => {
      configOSCFaders()
    })
  }

  tcp.on('close', () => {
    log('OSC TCP connection closed.')
    io.emit('osc-connection', false)
  })

  tcp.open()
}

function closeTCPSocket() {
  if (tcp) {
    log('Closing existing OSC TCP socket...')
    tcp.close()
    tcp = null
    io.emit('osc-connection', false)
  }
}

function changeTCPAddress(address: string, port: number) {
  config.tcp.localAddress = address
  config.tcp.localPort = port
  if (tcp) {
    closeTCPSocket()
    openTCPSocket()
  }
}

function handleOSCMessage(msg: any) {
  log(JSON.stringify(msg), 'OSC')

  const matchFader = msg.address.match(/\/eos\/fader\/1\/(\d+)/)

  if (matchFader) {
    setFaders(fs =>
      fs.map(fader => {
        if (fader.config.mode === 'fader' && fader.config.eosController === parseInt(matchFader[1])) {
          return { ...fader, value: msg.args[0] * 127 }
        } else return fader
      }),
    )
  }

  if (msg.address === '/eos/out/active/chan') {
    const regex = /(\d+(?:-\d+)?(?:,\d+(?:-\d+)?)*)\s*\[(\d+)]/
    const match = msg.args[0].match(regex)
    if (!match) return null

    const channels = match[1].split(',').flatMap((part: string) => {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(Number)
        return Array.from({ length: end - start + 1 }, (_, i) => start + i)
      }
      return [Number(part)]
    })
    const value = Number(match[2])

    channels.map((channel: number) => {
      setFaders(fs =>
        fs.map(fader => {
          if (fader.config.mode === 'chan' && fader.config.eosController === channel)
            return { ...fader, value: (value / 100) * 127 }
          else return fader
        }),
      )
    })
  }
}

function initializeOSCSocket() {
  log('Initializing OSC socket...')
  if ((config.tcp.input || config.tcp.output) && !tcp) {
    openTCPSocket()
  } else if (!(config.tcp.input || config.tcp.output) && tcp) {
    closeTCPSocket()
  }
}

function configOSCFaders() {
  log('Configuring OSC faders...')
  tcp.send({
    address: `/eos/fader/1/config/${getFaders().length}`,
  })
}

export { initializeOSCSocket, openTCPSocket, closeTCPSocket, changeTCPAddress, configOSCFaders, tcp }
