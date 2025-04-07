import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { FaderMode } from '../../../shared/types.ts'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getId = () => {
  const dateString = Date.now().toString(36)
  const randomness = Math.random().toString(36).substring(2)
  return dateString + randomness
}

export const faderModeLabels: { [key in FaderMode]: string } = {
  sub: 'Submaster',
  fader: 'Fader',
  chan: 'Channel',
}
