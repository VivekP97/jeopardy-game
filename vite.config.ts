import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, type Connect, type Plugin } from 'vite'

const projectRoot = fileURLToPath(new URL('.', import.meta.url))

function createJsonFileHandler(filePath: string): Connect.NextHandleFunction {
  return (req, res, next) => {
    const method = req.method?.toUpperCase()

    if (method === 'GET') {
      try {
        const content = readFileSync(filePath, 'utf-8')
        res.setHeader('Content-Type', 'application/json')
        res.statusCode = 200
        res.end(content)
      } catch {
        res.statusCode = 404
        res.end(JSON.stringify({ error: 'File not found' }))
      }
      return
    }

    if (method === 'PUT') {
      let body = ''
      req.on('data', (chunk: Buffer | string) => {
        body += chunk.toString()
      })
      req.on('end', () => {
        try {
          JSON.parse(body)
          writeFileSync(filePath, body, 'utf-8')
          res.setHeader('Content-Type', 'application/json')
          res.statusCode = 200
          res.end(body)
        } catch {
          res.statusCode = 400
          res.end(JSON.stringify({ error: 'Invalid JSON body' }))
        }
      })
      return
    }

    next()
  }
}

function jsonFileApi(apiPath: string, relativeFilePath: string): Plugin {
  const absolutePath = resolve(projectRoot, relativeFilePath)

  return {
    name: `json-file-api-${apiPath.replace(/\//g, '-')}`,
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = req.url?.split('?')[0]
        if (pathname !== apiPath) {
          next()
          return
        }

        createJsonFileHandler(absolutePath)(req, res, next)
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    jsonFileApi('/api/board', 'public/data/board.json'),
    jsonFileApi('/api/saved-game', 'public/data/saved-game.json'),
  ],
})
