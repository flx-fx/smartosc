import {
  createFader,
  createFaderGroup,
  emitConfig,
  emitFaderGroups,
  emitFaderProfiles,
  emitFaders,
  log,
  setStartOnBoot,
} from './utils.js'
import { Fader, FaderConfig, FaderGroup, Id } from '../../shared/types.js'
import { config } from './config.js'
import {
  createFaderProfile,
  faderProfiles,
  getFaderGroups,
  getFaderProfile,
  setFaderGroups,
  setFaderProfile,
  setFaders,
} from './fader-profiles.js'
import { changeTCPAddress, initializeOSCSocket, tcp } from './osc.js'
import { getInputs } from 'easymidi'
import { changeMidiDevice, initializeMidiInput, midiInput } from './midi.js'
import { io } from './server.js'

function setupSocketHandlers() {
  log('Setting up socket handlers...')
  io.on('connection', socket => {
    log('Client connected.')

    socket.on('fp-create', (name?: string, numFGs?: number, numFs?: number) => {
      config.app.faderProfileId = createFaderProfile(name, numFGs, numFs).id
      emitFaderProfiles()
      emitConfig()
      emitFaders()
      emitFaderGroups()
    })

    socket.on('fp-update', (name: string) => {
      setFaderProfile(fp => ({ ...fp, name: name }))
      emitFaderProfiles()
    })

    socket.on('fp-delete', () => {
      faderProfiles.delete(config.app.faderProfileId)
      config.app.faderProfileId = ''
      emitFaders()
      emitFaderGroups()
      emitFaderProfiles()
      emitConfig()
    })

    socket.on('fp-set-id', (id: Id) => {
      log(`Setting fader profile ID: ${id}`)
      config.app.faderProfileId = id
      emitFaders()
      emitFaderGroups()
      emitConfig()
    })

    socket.on('fps-get', () => {
      emitFaderProfiles()
    })

    socket.on('fgs-fs-init', () => {
      emitFaderGroups()
      emitFaders()
    })

    socket.on('fg-create', callback => {
      const newGroup = createFaderGroup()
      callback(newGroup)
    })

    socket.on('fg-delete', (id: Id) => {
      log(`Deleting fader group with ID: ${id}`)
      const fP = getFaderProfile()
      if (fP) {
        setFaderProfile({
          ...fP,
          faderGroups: fP.faderGroups.filter((fg: FaderGroup) => fg.id !== id),
          faders: fP.faders.filter((f: Fader) => f.groupId !== id),
        })
      } else {
        console.error('Fader profile is undefined')
      }
      emitFaderGroups()
    })

    socket.on('fg-update', (id: Id, name: string) => {
      log(`Updating fader group with ID: ${id}, new name: ${name}`)
      setFaderGroups(fgs =>
        fgs.map(fg => {
          if (fg.id === id) return { ...fg, name }
          return fg
        }),
      )
      emitFaderGroups()
    })

    socket.on('f-create', (groupId?: Id) => {
      setFaders(fs => [
        ...fs,
        createFader(
          groupId ? groupId : getFaderGroups().length ? getFaderGroups()[0].id : createFaderGroup().id,
          config.app.defaultFaderMode,
          fs.length + 1,
          fs.length + 1,
        ),
      ])
      emitFaders()
    })

    socket.on('f-delete', (id: Id) => {
      log(`Deleting fader with ID: ${id}`)
      setFaders(fs => fs.filter(f => f.id !== id))
      emitFaders()
    })

    socket.on('f-update-config', (id: Id, newConfig: FaderConfig) => {
      log(`Updating fader config for ID: ${id}, new config: ${JSON.stringify(newConfig)}`)
      setFaders(fs =>
        fs.map(fader => {
          if (fader.id !== id) return fader
          return { ...fader, config: newConfig }
        }),
      )
      emitFaders()
    })

    socket.on('f-update-value', (id: Id, value: number) => {
      setFaders(fs =>
        fs.map(fader => {
          if (fader.id !== id) return fader
          return { ...fader, value: value }
        }),
      )
      emitFaders()
    })

    socket.on('fgs-update', (faderGroups: FaderGroup[]) => {
      setFaderGroups(faderGroups)
    })

    socket.on('fs-update', (faders: Fader[]) => {
      setFaders(faders)
    })

    socket.on('c-get', callback => {
      callback(config)
    })

    socket.on('midi-ds-get', callback => {
      const dvs = getInputs()
      log(`Midi devices: ${dvs}`)
      callback(dvs)
    })

    socket.on('midi-d', midiDevice => {
      log(`Setting MIDI device: ${midiDevice}`)
      changeMidiDevice(midiDevice)
      emitConfig()
    })

    socket.on('midi-in', () => {
      config.midi.input = !config.midi.input
      initializeMidiInput()
      emitConfig()
    })

    socket.on('midi-chan', chan => {
      log(`Setting MIDI channel: ${chan}`)
      config.midi.channel = chan
      emitConfig()
    })

    socket.on('tcp-address', address => {
      log(`Setting TCP address: ${address}`)
      changeTCPAddress(address, config.tcp.localPort)
      emitConfig()
    })

    socket.on('tcp-port', port => {
      log(`Setting TCP port: ${port}`)
      changeTCPAddress(config.tcp.localAddress, port)
      emitConfig()
    })

    socket.on('osc-in', () => {
      config.tcp.input = !config.tcp.input
      initializeOSCSocket()
      emitConfig()
    })

    socket.on('osc-out', () => {
      config.tcp.output = !config.tcp.output
      initializeOSCSocket()
      emitConfig()
    })

    socket.on('app-theme', theme => {
      log(`Updating theme: ${theme}`)
      config.app.theme = theme
      emitConfig()
    })

    socket.on('app-autostart', () => {
      config.app.autostart = !config.app.autostart
      setStartOnBoot(config.app.autostart)
      emitConfig()
    })

    socket.on('app-autostart-ui', () => {
      config.app.autostartUI = !config.app.autostartUI
      emitConfig()
    })

    socket.on('app-default-fader-mode', mode => {
      log(`Setting default fader mode to ${mode}...`)
      config.app.defaultFaderMode = mode
      emitConfig()
    })

    socket.on('connections-init', () => {
      socket.emit('osc-connection', tcp !== null)
      socket.emit('midi-connection', midiInput !== null)
    })
  })
}

export { setupSocketHandlers }
