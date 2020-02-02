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
      for (const schema of schemas) {
        const questionnaire = await getQuestionnaireFromPublisher(schema.author_id)
        questionnaire.theme = themeLookup[schema.theme]
        questionnaire.form_type = form_type
        questionnaire.survey_id = survey_id
        const model = {
          author_id: schema.author_id,
          survey_id: survey_id,
          form_type: form_type,
          date_published: Date.now(),
          survey_version: schema.survey_version || "v0",
          schema: JSON.stringify(questionnaire),
          title: questionnaire.title,
          language: schema.language || "en",
          runner_version: schema.runner_version || "v0",
          qid: qid
        }
        await database.saveQuestionnaire(model)
      }
    }
  }
  catch (e) {
    console.log(e)
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
