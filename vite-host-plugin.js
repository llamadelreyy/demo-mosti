// Custom Vite plugin to disable host checking
export default function disableHostCheck() {
  return {
    name: 'disable-host-check',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Allow all hosts
        req.headers.host = 'localhost:5174'
        next()
      })
    }
  }
}