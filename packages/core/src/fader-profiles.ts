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
  const fpId = profileId ? profileId : config.app.faderProfileId

  if (faderProfiles.has(fpId)) {
    return faderProfiles.get(fpId)
  }
}

function getFaderGroups() {
  return getFaderProfile()?.faderGroups ?? []
}

function getFaders() {
  return getFaderProfile()?.faders ?? []
}

function setFaderProfile(newFaderProfile: FaderProfile | ((fp: FaderProfile) => FaderProfile), profileId?: Id) {
  const fpId = profileId ? profileId : config.app.faderProfileId

  if (typeof newFaderProfile === 'function') {
    const existingProfile = getFaderProfile(profileId)
    if (existingProfile) {
      const updatedProfile = newFaderProfile(existingProfile)
      faderProfiles.set(fpId, updatedProfile)
    } else {
      log(`setFaderProfile: Fader profile not found: ${fpId}`, 'error')
    }
  } else {
    faderProfiles.set(fpId, newFaderProfile)
  }
}

function setFaderGroups(newFaderGroups: FaderGroup[] | ((fgs: FaderGroup[]) => FaderGroup[])) {
  setFaderProfile(fp => {
    fp.faderGroups = typeof newFaderGroups === 'function' ? newFaderGroups(fp.faderGroups) : newFaderGroups
    return fp
  })
}

function setFaders(newFaders: Fader[] | ((fs: Fader[]) => Fader[]), profileId?: Id) {
  setFaderProfile(fp => {
    fp.faders = typeof newFaders === 'function' ? newFaders(fp.faders) : newFaders
    return fp
  }, profileId)
}

function writeFaderProfiles() {
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
  return (
    typeof obj === 'object' &&
    obj !== null &&
    (typeof obj.id === 'string' || typeof obj.id === 'number') &&
    typeof obj.name === 'string' &&
    Array.isArray(obj.faderGroups) &&
    Array.isArray(obj.faders)
  )
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
