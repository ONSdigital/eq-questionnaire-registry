const { getQuestionnaireSummary: getSummary } = require("../database")

const getQuestionnaireSummary = async (req, res, next) => {
  try {
    const Questionnaires = await getSummary(req.latest)
    res.status(200).json(Questionnaires)
  }
  catch (e) {
    res.status(500).json({ message: "Error listing questionnaires" })
  }
}

module.exports = getQuestionnaireSummary
