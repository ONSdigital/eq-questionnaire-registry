const database = require("../database")

const themeLookup = {
  "Northern Ireland": "northernireland",
  ONS: "default",
  Social: "social",
  "UKIS Northern Ireland": "ukis_ni",
  "UKIS ONS": "ukis"
}

module.exports = async (req, res, next) => {
  const { qid, survey_id, form_type, survey_version, schema, runner_version = "v2", language = "en", theme = "ONS" } = req.body
  try {
    schema.theme = themeLookup[theme]
    schema.form_type = form_type
    schema.survey_id = survey_id
    const model = {
      qid: qid,
      author_id: schema.eq_id,
      survey_id: survey_id,
      form_type: form_type,
      date_published: Date.now(),
      survey_version: survey_version,
      schema: JSON.stringify(schema),
      title: schema.title,
      language: language,
      runner_version: runner_version
    }
    await database.saveQuestionnaire(model)
    res.status(200).json({ message: "Ok" })
    next()
  }
  catch (e) {
    res.status(500).json({
      message: "Sorry, something went wrong inserting into the register"
    })
    next()
  }
}
