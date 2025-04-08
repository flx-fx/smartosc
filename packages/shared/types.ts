export type Id = string | number

export type FaderMode = 'sub' | 'fader' | 'chan'

export type FaderConfig = {
  mode: FaderMode
  midiController: number
  eosController: number
}

export type FaderGroup = {
  id: Id
  name: string
}

export type Fader = {
  id: Id
  groupId: Id
  value: number
  lastMidi?: number
  config: FaderConfig
}

export type Config = {
  app: {
    faderProfileId: Id
    theme?: Theme
    autostart?: boolean
    autostartUI?: boolean
    defaultFaderMode: FaderMode
  }
  tcp: {
    input: boolean
    output: boolean
    localAddress: string
    localPort: number
  }
  midi: {
    input: boolean
    device: string
    channel: number
  }
}

export type FaderProfile = {
  id: Id
  name: string
  faderGroups: FaderGroup[]
  faders: Fader[]
}

export type LogType = 'log' | 'info' | 'warn' | 'error' | 'TCP' | 'MIDI'

export type Theme = 'dark' | 'light' | 'system'

export type Log = {
  id: Id
  time: number
  type?: LogType
  message: string
}
