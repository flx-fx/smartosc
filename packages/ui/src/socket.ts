import { io } from 'socket.io-client'

const socketUrl = import.meta.env.DEV ? 'http://localhost:5000' : window.location.origin

export const socket = io(socketUrl)

socket.on('connect', () => {
  console.log('Connected to server')
})

socket.on('connect_error', error => {
  console.error('Connection error:', error)
})

socket.on('log', () => {
  console.log('LOG')
})

socket.on('disconnect', () => {
  console.log('Disconnected from server')
})
