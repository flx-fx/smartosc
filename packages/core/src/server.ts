import express from 'express'
import { createServer } from 'node:http'
import { Server } from 'socket.io'
import cors from 'cors'
import path, { dirname } from 'path'
import { log, openUI } from './utils.js'
import { fileURLToPath } from 'url'
import { config } from './config.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const io = new Server()
let serverUrl: string | null = null

function initializeServer() {
  const app = express()
  const server = createServer(app)
  io.attach(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  })

  app.use(cors())

  app.use(express.static(path.join(__dirname, '../../../../ui/dist')))

  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '../../../../ui/dist', 'index.html'))
  })

  server.listen(5000, () => {
    const address = server.address()
    if (address && typeof address !== 'string') {
      serverUrl = `http://localhost:${address.port}`
      log(`Server running on address: ${serverUrl}`)
      if (config.app.autostartUI) {
        openUI()
      }
    } else {
      log('Failed to get server address', 'error')
    }
  })
}

export { initializeServer, io, serverUrl }
