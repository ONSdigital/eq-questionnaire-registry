const database = require("../database")
const { uuid } = require('uuidv4')

const themeLookup = {
  "Northern Ireland": "northernireland",
  ONS: "default",
  Social: "social",
  "UKIS Northern Ireland": "ukis_ni",
  "UKIS ONS": "ukis"
}

const insertIntoSurveyResister = async (req, res, next) => {
  const { surveyId, formTypes, surveyVersion, runner_version = "v2", language = "en" } = req.body
  let error = false
  try {
    Object.keys(formTypes).forEach(async (key) => {
      const questionnaire = res.questionnaire
      questionnaire.theme = themeLookup[key]
      questionnaire.form_type = formTypes[key]
      const qid = uuid()
      const model = {
        author_id: questionnaire.eq_id,
        survey_id: surveyId,
        form_type: formTypes[key],
        date_published: Date.now(),
        survey_version: surveyVersion,
        schema: JSON.stringify(questionnaire),
        title: questionnaire.title,
        language: language,
        runner_version: runner_version,
        qid: qid
      }
      await database.saveQuestionnaire(model)
    })
  }
  catch (e) {
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
