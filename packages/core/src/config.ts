import path from 'path'
import os from 'os'
import fs from 'fs'
import { getId } from '../../shared/utils.js'
import { Config } from '../../shared/types.js'
import { log } from './utils.js'

const appDataPath = path.join(os.homedir(), process.platform === 'win32' ? 'AppData\\Roaming\\smartosc' : '.smartosc')
const configPath = path.join(appDataPath, 'config.json')

const newFaderProfileId = getId()

let config: Config = {
  app: {
    faderProfileId: newFaderProfileId,
    defaultFaderMode: 'sub',
  },
  tcp: {
    input: true,
    output: true,
    localAddress: '127.0.0.1',
    localPort: 3032,
  },
  midi: {
    input: true,
    device: '',
    channel: 0,
  },
}

function initializeConfig() {
  fs.mkdirSync(appDataPath, { recursive: true })

  if (fs.existsSync(configPath)) {
    try {
      const parsedConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
      if (isConfig(parsedConfig)) {
        config = parsedConfig
      } else {
        log('Incorrect config file structure. Using default configuration.', 'error')
      }
    } catch (error) {
      log(`Failed to read or parse config file: ${error}`, 'error')
    }
  }
}

function writeConfig() {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
    log('Config file written')
  } catch (error) {
    log(`Failed to write config file: ${error}`, 'error')
  }
}

function isConfig(obj: any): obj is Config {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.app === 'object' &&
    (typeof obj.app.autostart === 'boolean' || typeof obj.app.autostart === 'undefined') &&
    (typeof obj.app.autostartUI === 'boolean' || typeof obj.app.autostartUI === 'undefined') &&
    typeof obj.app.defaultFaderMode === 'string' &&
    (typeof obj.app.faderProfileId === 'string' || typeof obj.app.faderProfileId === 'number') &&
    typeof obj.tcp === 'object' &&
    typeof obj.tcp.input === 'boolean' &&
    typeof obj.tcp.output === 'boolean' &&
    typeof obj.tcp.localAddress === 'string' &&
    typeof obj.tcp.localPort === 'number' &&
    typeof obj.midi === 'object' &&
    typeof obj.midi.input === 'boolean' &&
    typeof obj.midi.device === 'string' &&
    typeof obj.midi.channel === 'number'
  )
}

export { initializeConfig, writeConfig, config }
