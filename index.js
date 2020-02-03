require('dotenv').config()
const express = require("express")

const {
  getQuestionnaireFromRegistry,
  insertIntoRegistry,
  getQuestionnaireSummary,
  insertQuestionnaireIntoRegistry
} = require("./middleware")

const app = express()

app.put("/questionnaires", express.json(), insertIntoRegistry)
app.post("/questionnaires", express.json(), insertIntoRegistry)
app.put("/questionnaires-json", express.json(), insertQuestionnaireIntoRegistry)
app.post("/questionnaires-json", express.json(), insertQuestionnaireIntoRegistry)

app.get("/questionnaires", express.json(), getQuestionnaireFromRegistry)
app.get("/questionnaires/:id", getQuestionnaireFromRegistry)
app.get("/questionnaires/:id/version/:version", getQuestionnaireFromRegistry)
app.get("/surveys/:survey_id/form-types/:form_type", getQuestionnaireFromRegistry)
app.get("/surveys/:survey_id/form-types/:form_type/languages/:language", getQuestionnaireFromRegistry)
app.get("/surveys/:survey_id/form-types/:form_type/versions/:version", getQuestionnaireFromRegistry)
app.get("/surveys/:survey_id/form-types/:form_type/languages/:language/versions/:version", getQuestionnaireFromRegistry)

app.get("/summary-latest",
  express.json(),
  (req, res, next) => {
    req.latest = true; next()
  },
  getQuestionnaireSummary
)

app.get("/summary-all",
  express.json(),
  (req, res, next) => {
    req.latest = false; next()
  },
  getQuestionnaireSummary
)

app.get("/status", (_, res) => res.sendStatus(200))

const PORT = process.env.PORT || 8080

app.listen(PORT, "0.0.0.0", () => {
  console.log("Listening on port", PORT); // eslint-disable-line
})
