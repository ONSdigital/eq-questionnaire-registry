const database = require("../database")

const getQuestionnaireFromRegistry = async (req, res, next) => {
  const requestParams = {}
  let data

  try {
    Object.assign(requestParams, req.body)
    Object.assign(requestParams, req.query)
    Object.assign(requestParams, req.params)

    data = await database.getQuestionnaire(requestParams)
    res.status(200).json(data)
    next()
  }
  catch (err) {
    if (err.message === "record not found") {
      res.status(500).json({
        message: "record not found"
      })
    }
    else {
      res.status(500).json({
        message: err.message
      })
    }
    next()
  }
}

module.exports = getQuestionnaireFromRegistry
