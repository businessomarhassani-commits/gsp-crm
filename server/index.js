const app = require('./app')
const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`ArchiCRM API démarré sur le port ${PORT}`))
