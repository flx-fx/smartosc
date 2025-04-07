import { Fader, FaderGroup, FaderMode, Id, LogType } from '../../shared/types.js'
import { getId } from '../../shared/utils.js'
import { config } from './config.js'
import { io, serverUrl } from './server.js'
import { Service } from 'node-windows'
import path from 'path'
import { faderProfiles, getFaderGroups, getFaders, setFaderGroups, setFaders } from './fader-profiles.js'
import open from 'open'

function log(message: string, type?: LogType) {
  switch (type) {
    case undefined:
    case 'log':
    case 'TCP':
    case 'MIDI':
      console.log(`[${type}]`, message)
      break
    case 'error':
      console.error(message)
      break
    case 'warn':
      console.warn(message)
      break
  }
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
      console.log('SmartOSC service installed')
    })
    svc.install()
  } else {
    svc.on('uninstall', () => {
      console.log('SmartOSC service uninstalled')
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
