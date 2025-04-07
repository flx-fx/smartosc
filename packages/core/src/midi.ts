import { Input } from 'easymidi'
import { config } from './config.js'
import { log } from './utils.js'
import { tcp } from './osc.js'
import { getFaders, setFaders } from './fader-profiles.js'
import { io } from './server.js'

let midiInput: Input | null = null

function openMidiInput(device: string) {
  try {
    midiInput = new Input(device)
    config.midi.device = device
    config.midi.input = true
    io.emit('midi-connection', true)
    log(`MIDI input opened for device: ${device}`)

    //@ts-expect-error
    midiInput.on('message', (msg: any) => {
      const vals = Object.keys(msg).map(key => `${key}: ${msg[key]}`)
      log(vals.join(', '), 'MIDI')
    })

    midiInput.on('cc', (param: any) => {
      const fader = getFaders().find(fader => fader.config.midiController === param.controller)
      if (
        fader &&
        (fader.lastMidi === undefined ||
          fader.value === param.value ||
          fader.value === fader.lastMidi ||
          (fader.value < fader.lastMidi && param.value < fader.value) ||
          (fader.value > fader.lastMidi && param.value > fader.value))
      ) {
        if (config.tcp.output)
          tcp.send({
            address: `/eos/user/0/${fader.config.mode === 'sub' ? 'sub' : fader.config.mode === 'fader' ? 'fader/1' : 'chan'}/${fader.config.eosController}`,
            args: [
              {
                type: 'f',
                value: fader.config.mode === 'chan' ? (param.value / 127) * 100 : param.value / 127,
              },
            ],
          })

        fader.value = param.value
        fader.lastMidi = param.value
        setFaders(fs =>
          fs.map(f => {
            if (f.id === fader.id) return fader
            else return f
          }),
        )
      }
    })

    midiInput.on('noteon', (param: any) => {
      const fader = getFaders().find(f => f.config.midiController === param.note)
      if (fader && config.tcp.output) {
        tcp.send({
          address: `/eos/user/0/${fader.config.mode === 'sub' ? `sub/${fader.config.eosController}/fire` : `${fader.config.mode === 'fader' ? 'fader/1/' : 'chan/'}${fader.config.eosController}`}`,
          args: [{ type: 'f', value: fader.config.mode === 'chan' ? 100 : 1.0 }],
        })
      }
    })

    midiInput.on('noteoff', (param: any) => {
      const fader = getFaders().find(f => f.config.midiController === param.note)
      if (fader && config.tcp.output) {
        tcp.send(
          fader.config.mode === 'sub'
            ? {
                address: `/eos/user/0/sub/${fader.config.eosController}/fire`,
                args: [{ type: 'f', value: 0.0 }],
              }
            : {
                address: `/eos/user/0/${fader.config.mode === 'fader' ? 'fader/1/' : 'chan/'}${fader.config.eosController}}`,
                args: [
                  { type: 'f', value: fader.config.mode === 'chan' ? (fader.value / 127) * 100 : fader.value / 127 },
                ],
              },
        )
      }
    })
  } catch (e) {
    log(`Failed to open MIDI input for device: ${device}, error: ${e}`, 'error')
    config.midi.input = false
    config.midi.device = ''
    midiInput = null
    io.emit('midi-connection', false)
  }
}

function closeMidiInput() {
  if (midiInput) {
    midiInput.close()
    midiInput = null
    config.midi.input = false
    io.emit('midi-connection', false)
    log('MIDI input closed')
  }
}

function changeMidiDevice(device: string) {
  closeMidiInput()
  openMidiInput(device)
}

function initializeMidiInput() {
  if (config.midi.input && !midiInput) {
    openMidiInput(config.midi.device)
  } else if (!config.midi.input && midiInput) {
    closeMidiInput()
  }
}

export { initializeMidiInput, openMidiInput, closeMidiInput, changeMidiDevice, midiInput }
