import { SysTray } from 'node-systray-v2'
import { initializeOSCSocket } from './osc.js'
import { initializeMidiInput } from './midi.js'
import { initializeConfig, writeConfig } from './config.js'
import { initializeServer, io } from './server.js'
import { setupSocketHandlers } from './socket-handlers.js'
import { initializeFaderProfiles, writeFaderProfiles } from './fader-profiles.js'
import { openUI } from './utils.js'

process.on('exit', () => {
  io.emit('exit')
  writeConfig()
  writeFaderProfiles()
})

initializeServer()
initializeConfig()
initializeFaderProfiles()
initializeOSCSocket()
initializeMidiInput()
setupSocketHandlers()

// Systray
const systray = new SysTray({
  menu: {
    icon: '',
    title: 'SmartOSC',
    tooltip: 'SmartOSC',
    items: [
      {
        title: 'Open SmartOSC',
        tooltip: 'Open SmartOSC configuration',
        checked: false,
        enabled: true,
      },
      {
        title: 'Exit',
        tooltip: 'Exit',
        checked: false,
        enabled: true,
      },
    ],
  },
  debug: true,
  copyDir: true,
})

systray.onError(err => {
  console.error(err)
})

systray.onReady(() => {
  systray.onClick(event => {
    if (event.seq_id === 0) {
      openUI()
    } else if (event.seq_id === 1) {
      systray.kill()
      process.exit()
    }
  })
})
