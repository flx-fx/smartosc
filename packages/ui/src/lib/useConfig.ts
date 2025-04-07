import { useEffect, useState } from 'react'
import { Config } from '../../../shared/types'
import { socket } from '@/socket'

export function useConfig() {
  const [config, setConfig] = useState<Config | null>(null)

  useEffect(() => {
    console.log('UseConfig')
    socket.emit('c-get', (config: Config) => setConfig(config))
    socket.on('c-update', config => {
      setConfig(config)
      console.log('Config update: ', config)
    })

    return () => {
      socket.off('c-update', config => setConfig(config))
    }
  }, [])

  return config
}
