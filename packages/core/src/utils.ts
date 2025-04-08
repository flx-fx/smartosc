import { Fader, FaderGroup, FaderMode, Id, LogType } from '../../shared/types.js'
import { getId } from '../../shared/utils.js'
import { config } from './config.js'
import { io, serverUrl } from './server.js'
import { Service } from 'node-windows'
import path from 'path'
import { faderProfiles, getFaderGroups, getFaders, setFaderGroups, setFaders } from './fader-profiles.js'
import open from 'open'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function log(message: string, type: LogType = 'log') {
  const logMethods: Record<LogType, (msg: string) => void> = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    OSC: console.log,
    MIDI: console.log,
  }

  const logMethod = logMethods[type] || console.log
  logMethod(`[${type}] ${message}`)

  io.emit('log', message, type)
}

function emitFaderGroups() {
  io.emit('fgs-update', getFaderGroups())
}

function emitFaders() {
  io.emit('fs-update', getFaders())
}

function emitConfig() {
  io.emit('c-update', config)
}

function emitFaderProfiles() {
  io.emit('fps-update', Array.from(faderProfiles.values()))
}

function createFaderGroup(name = 'New Group'): FaderGroup {
  const newFaderGroup = {
    id: getId(),
    name: name,
  }
  setFaderGroups(fgs => [...fgs, newFaderGroup])
  emitFaderGroups()
  return newFaderGroup
}

function createFader(
  groupId: Id,
  mode: FaderMode = config.app.defaultFaderMode,
  midiController = 1,
  eosController = 1,
) {
  const newFader: Fader = {
    id: getId(),
    groupId: groupId,
    value: 0,
    config: {
      mode: mode,
      midiController: midiController,
      eosController: eosController,
    },
  }
  setFaders(fs => [...fs, newFader])
  emitFaders()
  return newFader
}

function setStartOnBoot(enable: boolean) {
  const svc = new Service({
    name: 'SmartOSC',
    description: 'SmartOSC server',
    script: path.join(__dirname, 'server.js'),
  })

  if (enable) {
    svc.on('install', () => {
      svc.start()
      log('SmartOSC service installed')
    })
    svc.install()
  } else {
    svc.on('uninstall', () => {
      log('SmartOSC service uninstalled')
    })
    svc.uninstall()
  }
}

function openUI() {
  if (serverUrl) {
    open(serverUrl).then()
  }
}

export {
  emitFaderGroups,
  emitFaders,
  emitConfig,
  emitFaderProfiles,
  log,
  createFaderGroup,
  createFader,
  setStartOnBoot,
  openUI,
}
