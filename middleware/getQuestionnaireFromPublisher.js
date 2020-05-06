const request = require("request-promise-native")

const { PUBLISHER_URL } = process.env

const getQuestionnaireFromPublisher = async (questionnaireId) => {
  const options = {
    json: true,
    uri: `${PUBLISHER_URL}${questionnaireId}`
  }
  try {
    const response = await request(options)
    return response
  }
  catch (e) {
    throw new Error(
      `Sorry, something went wrong with the Publisher request; ${e.message}`
    )
  }
}

module.exports = getQuestionnaireFromPublisher
