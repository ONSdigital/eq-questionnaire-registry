const database = require("../database")
const { uuid } = require('uuidv4')
const getQuestionnaireFromPublisher = require("./getQuestionnaireFromPublisher")

const themeLookup = {
  "Northern Ireland": "northernireland",
  ONS: "default",
  Social: "social",
  "UKIS Northern Ireland": "ukis_ni",
  "UKIS ONS": "ukis"
}

const insertIntoSurveyResister = async (req, res, next) => {
  let error = false
  const data = req.body
  try {
    if (!data) {
      throw new Error("No data in request body")
    }
    for (const doc of data) {
      const { survey_id, form_type, schemas } = doc
      const qid = uuid()
      for (const schemaInfo of schemas) {
        const questionnaire = await getQuestionnaireFromPublisher(schemaInfo.author_id)
        questionnaire.theme = themeLookup[schemaInfo.theme]
        questionnaire.form_type = form_type
        questionnaire.survey_id = survey_id
        const { survey_version = "0", title } = questionnaire
        const { author_id, language = "en", runner_version = "v0" } = schemaInfo
        const model = {
          author_id,
          survey_id,
          form_type,
          date_published: Date.now(),
          survey_version,
          schema: JSON.stringify(questionnaire),
          title,
          language,
          runner_version,
          qid
        }
        await database.saveQuestionnaire(model)
      }
    }
  }
  catch (e) {
    console.error(e)
    error = true
  }

  if (error) {
    res.status(500).json({
      message: "Sorry, something went wrong inserting into the register"
    })
    next()
  }
  else {
    res.status(200).json({ message: "Ok" })
    next()
  }
}

module.exports = insertIntoSurveyResister
