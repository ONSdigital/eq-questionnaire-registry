const mockSchema = require("./mocks/mockSchema")
jest.mock('request')
const request = require("request-promise-native")
const getQuestionnaireFromPublisher = require("./getQuestionnaireFromPublisher")

const mockRequest = () => {
  const req = {
    params: {},
    query: {},
    body: {
      survey_id: "001",
      form_type: "ONS",
      language: "en"
    }
  }
  return req
}

describe("testing getQuestionnaireFromPublisher", () => {
  let req

  it(`should get the return a schema from the registry`, async () => {
    req = mockRequest()
    request.mockResolvedValue(mockSchema())
    expect(await getQuestionnaireFromPublisher(req)).toMatchObject(mockSchema())
  })

  it(`should handle a thrown error`, async () => {
    req = { questionnaireId: "123" }
    request.mockImplementation(async () => {
      throw new Error("test error")
    })
    expect(getQuestionnaireFromPublisher(req)).rejects.toEqual(new Error("Sorry, something went wrong with the Publisher request"))
  })
})
