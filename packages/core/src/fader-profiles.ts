import fs from 'fs'
import path from 'path'
import os from 'os'
import { Fader, FaderGroup, FaderProfile, Id } from '../../shared/types.js'
import { createFader, createFaderGroup, log } from './utils.js'
import { getId } from '../../shared/utils.js'
import { config } from './config.js'

const appDataPath = path.join(os.homedir(), process.platform === 'win32' ? 'AppData\\Roaming\\smartosc' : '.smartosc')
const faderProfilesPath = path.join(appDataPath, 'faderProfiles')

let faderProfiles: Map<Id, FaderProfile> = new Map()

function initializeFaderProfiles() {
  log('Initializing fader profiles...')

  fs.mkdirSync(path.join(appDataPath, 'faderProfiles'), { recursive: true })

  if (fs.existsSync(faderProfilesPath)) {
    try {
      const filenames = fs.readdirSync(faderProfilesPath).filter(filename => filename.endsWith('.json'))
      log(`Found fader profile files: ${filenames.join(', ')}`)
      filenames.forEach(filename => {
        const parsedFaderProfile = JSON.parse(fs.readFileSync(path.join(faderProfilesPath, filename), 'utf-8'))
        if (isFaderProfile(parsedFaderProfile)) {
          faderProfiles.set(parsedFaderProfile.id, parsedFaderProfile)
          log(`Loaded fader profile: ${parsedFaderProfile.id}`)
        } else {
          log(`Incorrect fader profile file structure in file "${filename}"`, 'error')
        }
      })
    } catch (error) {
      log(`Failed to read or parse fader profile file(s): ${error}`, 'error')
    }
  }
  log('Fader profiles initialized.')
}

function createFaderProfile(name = 'New Profile', numFGs = 0, numFs = 0): FaderProfile {
  const newProfile: FaderProfile = {
    id: getId(),
    name: name,
    faderGroups: [],
    faders: [],
  }
  faderProfiles.set(newProfile.id, newProfile)
  config.app.faderProfileId = newProfile.id

  log(`Creating fader profile with name: ${name}, numFGs: ${numFGs}, numFs: ${numFs}`)
  const newFGs: FaderGroup[] = []
  const newFs: Fader[] = []

  for (let i = 0; i < numFGs; i++) {
    newFGs.push(createFaderGroup(`Group ${i + 1}`))
  }

  for (let i = 0; i < numFs; i++) {
    if (newFGs.length === 0) {
      newFGs.push(createFaderGroup())
    }
    newFs.push(createFader(newFGs[i % newFGs.length].id, config.app.defaultFaderMode, i + 1, i + 1))
  }
  newProfile.faderGroups = newFGs
  newProfile.faders = newFs
  faderProfiles.set(newProfile.id, newProfile)
  log(`Created fader profile: ${newProfile.id}`)
  return newProfile
}

function getFaderProfile(profileId?: Id) {
  log('Getting fader profile...')
  const fpId = profileId ? profileId : config.app.faderProfileId

  if (faderProfiles.has(fpId)) {
    log(`Fader profile found: ${fpId}`)
    return faderProfiles.get(fpId)
  }
}

function getFaderGroups() {
  log('Getting fader groups...')
  const faderGroups = getFaderProfile()?.faderGroups ?? []
  log(`Fader groups: ${JSON.stringify(faderGroups)}`)
  return faderGroups
}

function getFaders() {
  log('Getting faders...')
  const faders = getFaderProfile()?.faders ?? []
  log(`Faders: ${JSON.stringify(faders)}`)
  return faders
}

function setFaderProfile(newFaderProfile: FaderProfile | ((fp: FaderProfile) => FaderProfile), profileId?: Id) {
  log('Setting fader profile...')
  const fpId = profileId ? profileId : config.app.faderProfileId

  if (typeof newFaderProfile === 'function') {
    const existingProfile = getFaderProfile(profileId)
    if (existingProfile) {
      const updatedProfile = newFaderProfile(existingProfile)
      faderProfiles.set(fpId, updatedProfile)
      log(`Updated fader profile: ${JSON.stringify(updatedProfile)}`)
    } else {
      log(`Fader profile not found: ${fpId}`, 'error')
    }
  } else {
    faderProfiles.set(fpId, newFaderProfile)
    log(`Set fader profile: ${JSON.stringify(newFaderProfile)}`)
  }
}

function setFaderGroups(newFaderGroups: FaderGroup[] | ((fgs: FaderGroup[]) => FaderGroup[])) {
  log('Setting fader groups...')
  setFaderProfile(fp => {
    fp.faderGroups = typeof newFaderGroups === 'function' ? newFaderGroups(fp.faderGroups) : newFaderGroups
    log(`Updated fader groups: ${JSON.stringify(fp.faderGroups)}`)
    return fp
  })
}

function setFaders(newFaders: Fader[] | ((fs: Fader[]) => Fader[]), profileId?: Id) {
  log('Setting faders...')
  setFaderProfile(fp => {
    fp.faders = typeof newFaders === 'function' ? newFaders(fp.faders) : newFaders
    log(`Updated faders: ${JSON.stringify(fp.faders)}`)
    return fp
  }, profileId)
}

function writeFaderProfiles() {
  log('Writing fader profiles...')
  try {
    faderProfiles.forEach(fp => {
      fs.writeFileSync(path.join(faderProfilesPath, `${fp.id}.json`), JSON.stringify(fp, null, 2))
      log(`Wrote fader profile: ${fp.id}`)
    })
  } catch (error) {
    log(`Failed to write fader profile file: ${error}`, 'error')
  }
}

function isFaderProfile(obj: any): obj is FaderProfile {
  const isValid =
    typeof obj === 'object' &&
    obj !== null &&
    (typeof obj.id === 'string' || typeof obj.id === 'number') &&
    typeof obj.name === 'string' &&
    Array.isArray(obj.faderGroups) &&
    Array.isArray(obj.faders)
  log(`Is fader profile: ${isValid}`)
  return isValid
}

export {
  initializeFaderProfiles,
  createFaderProfile,
  getFaderProfile,
  getFaderGroups,
  getFaders,
  setFaderProfile,
  setFaderGroups,
  setFaders,
  writeFaderProfiles,
  faderProfiles,
}
