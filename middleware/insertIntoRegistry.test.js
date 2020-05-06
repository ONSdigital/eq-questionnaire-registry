const databases = ["dynamo", "firestore"]
const mockSchema = require("./mocks/mockSchema")

const mockResponse = () => {
  const res = { questionnaire: mockSchema() }
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

const mockRequest = () => {
  const req = {
    body: {
      questionnaireId: "c0d5facb-3c16-4119-840c-77e07ffc794b",
      surveyVersion: 1,
      publishDetails: [
        {
          surveyId: "ins_test_001",
          formType: "123",
          variants: [
            {
              language: "en",
              theme: "ONS",
              author_id: "456"
            }
          ]
        }
      ]
    }
  }
  return req
}

const mockBadRequest = () => {
  const badReq = {
    body: {
      surveyId: "1"
    }
  }
  return badReq
}

const mockDbCall = () => {
  const dbCall = {
    survey_id: "ins_test_001",
    form_type: "123"
  }
  return dbCall
}

describe.each(databases)("testing InsertIntoRegistry", (databaseName) => {
  let res, req, insertIntoRegistry, database
  const next = jest.fn()

  beforeAll(() => {
    jest.resetModules()
    process.env.REGISTRY_DATABASE_SOURCE = databaseName
    insertIntoRegistry = require("./insertIntoRegistry")
    database = require("../database")
    jest.mock("./getQuestionnaireFromPublisher", () => () => mockSchema())
  })

  it(`should add a record into the registry using ${databaseName}`, async () => {
    res = mockResponse()
    req = mockRequest()
    await insertIntoRegistry(req, res, next)
    const checkData = await database.getQuestionnaire(mockDbCall())
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ message: "Ok" })
    expect(checkData).toEqual(
      expect.objectContaining({ survey_id: "ins_test_001", form_type: "123" })
    )
  })

  it(`should throw an error when sending a bad request using ${databaseName}`, async () => {
    res = mockResponse()
    req = mockBadRequest()
    const spy = jest.spyOn(console, "error").mockImplementation(() => {})
    await insertIntoRegistry(req, res, next)
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({
      message: "Sorry, something went wrong inserting into the register"
    })
    spy.mockRestore()
  })

  it(`should throw an error when sending no data using ${databaseName}`, async () => {
    res = mockResponse()
    req = {}
    const spy = jest.spyOn(console, "error").mockImplementation(() => {})
    await insertIntoRegistry(req, res, next)
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({
      message: "Sorry, something went wrong inserting into the register"
    })
    spy.mockRestore()
  })
})
