const databaseModule = () => {
  if (process.env.REGISTRY_DATABASE_SOURCE) {
    return ('./' + process.env.REGISTRY_DATABASE_SOURCE)
  }
  else {
    return ('./firestore')
  }
}

const database = require(databaseModule())

module.exports = database
