const databases = ["dynamo", "firestore"]
const mockSchema = require("./mocks/mockSchema")

const mockResponse = () => {
  const res = { questionnaire: mockSchema() }
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

const mockRequest = () => {
  return {
    body: [{
      survey_id: "ins_test_001",
      form_type: "123",
      schemas: [
        {
          language: "en",
          theme: "ONS",
          author_id: "456",
          survey_version: "1"
        }]
    }]
  }
}

const mockBadRequest = () => {
  return {
    body: {
      surveyId: "1"
    }
  }
}

const mockDbCall = () => {
  return {
    survey_id: "ins_test_001",
    form_type: "123"
  }
}

describe.each(databases)("testing InsertIntoRegistry", (databaseName) => {
  let res, req, insertIntoRegistry, database
  const next = jest.fn()

  beforeAll(() => {
    jest.resetModules()
    process.env.REGISTRY_DATABASE_SOURCE = databaseName
    insertIntoRegistry = require("./insertIntoRegistry")
    database = require("../database")
    jest.mock('./getQuestionnaireFromPublisher', () => () => (mockSchema()))
  })

  it(`should add a record into the registry using ${databaseName}`, async () => {
    res = mockResponse()
    req = mockRequest()
    await insertIntoRegistry(req, res, next)
    const checkData = await database.getQuestionnaire(mockDbCall())
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ message: "Ok" })
    expect(checkData).toEqual(expect.objectContaining({ survey_id: "ins_test_001", form_type: "123" }))
  })

  it(`should throw an error when sending a bad request using ${databaseName}`, async () => {
    res = mockResponse()
    req = mockBadRequest()
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    await insertIntoRegistry(req, res, next)
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ message: "Sorry, something went wrong inserting into the register" })
    spy.mockRestore()
  })

  it(`should throw an error when sending no data using ${databaseName}`, async () => {
    res = mockResponse()
    req = {}
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    await insertIntoRegistry(req, res, next)
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ message: "Sorry, something went wrong inserting into the register" })
    spy.mockRestore()
  })
})
