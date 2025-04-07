import { useEffect, useState } from 'react'
import { socket } from '@/socket.ts'

export function useConnection() {
  const [socketConnection, setSocketConnection] = useState(socket.connected)
  const [oscConnection, setOscConnection] = useState<boolean>(false)
  const [midiConnection, setMidiConnection] = useState<boolean>(false)

  useEffect(() => {
    socket.emit('connections-init')

    function onSocketConnect() {
      setSocketConnection(true)
    }

    function onSocketDisconnect() {
      setSocketConnection(false)
    }

    function onOSCConnection(connected: boolean) {
      setOscConnection(connected)
    }

    function onMIDIConnection(connected: boolean) {
      setMidiConnection(connected)
    }

    socket.on('connect', onSocketConnect)
    socket.on('disconnect', onSocketDisconnect)
    socket.on('osc-connection', onOSCConnection)
    socket.on('midi-connection', onMIDIConnection)

    return () => {
      socket.off('connect', onSocketConnect)
      socket.off('disconnect', onSocketDisconnect)
      socket.off('osc-connection', onOSCConnection)
      socket.off('midi-connection', onMIDIConnection)
    }
  }, [])

  return { socketConnection, oscConnection, midiConnection }
}
