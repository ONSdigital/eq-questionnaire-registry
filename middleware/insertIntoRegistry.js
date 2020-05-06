const database = require("../database");
const { uuid } = require("uuidv4");
const getQuestionnaireFromPublisher = require("./getQuestionnaireFromPublisher");

const themeLookup = {
  "Northern Ireland": "northernireland",
  ONS: "default",
  Social: "social",
  "UKIS Northern Ireland": "ukis_ni",
  "UKIS ONS": "ukis",
};

const insertIntoSurveyResister = async (req, res, next) => {
  let error = false;
  const data = req.body;
  try {
    if (!data) {
      throw new Error("No data in request body");
    }
    for (const doc of data.publishDetails) {
      const { surveyId: survey_id, formType: form_type, variants } = doc;
      console.log(
        `Request to publish questionnaire {survey_id: ${survey_id}, form_type: ${form_type}} received`
      );
      const qid = uuid();
      for (const {
        author_id,
        language = "en",
        runner_version = "v0",
        theme,
      } of variants) {
        const questionnaire = await getQuestionnaireFromPublisher(author_id);
        questionnaire.theme = themeLookup[theme];
        questionnaire.form_type = form_type;
        questionnaire.survey_id = survey_id;
        const { survey_version = "0", title } = questionnaire;
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
          qid,
        };
        await database.saveQuestionnaire(model);
        console.log(
          `Questionnaire {survey_id: ${survey_id}, form_type: ${form_type}} saved`
        );
      }
    }
  } catch (e) {
    console.error(e);
    error = true;
  }

  if (error) {
    res.status(500).json({
      message: "Sorry, something went wrong inserting into the register",
    });
    next();
  } else {
    res.status(200).json({ message: "Ok" });
    next();
  }
};

module.exports = insertIntoSurveyResister;
