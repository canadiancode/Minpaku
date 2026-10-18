import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Serves Netlify Functions that declare `config.path` (e.g. /api/contact) from
 * the Vite dev server, so the contact form works locally without the Netlify CLI.
 */
function netlifyFunctionsInDev() {
  const routes = { '/api/contact': '/netlify/functions/contact.mjs' }
  return {
    name: 'netlify-functions-in-dev',
    configureServer(server) {
      Object.assign(process.env, loadEnv(server.config.mode, process.cwd(), ''))
      server.middlewares.use(async (request, response, next) => {
        const modulePath = routes[request.url?.split('?')[0]]
        if (!modulePath) return next()
        try {
          const chunks = []
          for await (const chunk of request) chunks.push(chunk)
          const { default: handler } = await server.ssrLoadModule(modulePath)
          const result = await handler(
            new Request(`http://localhost${request.url}`, {
              method: request.method,
              headers: request.headers,
              body: ['GET', 'HEAD'].includes(request.method) ? undefined : Buffer.concat(chunks),
            }),
          )
          response.statusCode = result.status
          result.headers.forEach((value, key) => response.setHeader(key, value))
          response.end(Buffer.from(await result.arrayBuffer()))
        } catch (error) {
          next(error)
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), netlifyFunctionsInDev()],
  build: {
    // Keep SVG URL imports as emitted files so `<image href>` always resolves in production.
    assetsInlineLimit: 0,
  },
})
