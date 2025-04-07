import { io } from 'socket.io-client'

export const socket = io('http://localhost:5000')

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
