const databases = ["dynamo", "firestore"]
const mockSchema = require("./mocks/mockSchema")

const mockResponse = () => {
  const res = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

const mockRequest = () => {
  return {
    body: {
      survey_id: "iqr_test_001",
      form_type: "O456",
      survey_version: "2",
      schema: mockSchema()
    }
  }
}

const mockBadRequest = () => {
  return {
    body: {
      survey_id: "123",
      survey_version: "2",
      theme: "ONS",
      language: "en",
      schema: mockSchema()
    }
  }
}

const mockDbCall = () => {
  return {
    survey_id: "iqr_test_001",
    form_type: "O456"
  }
}

describe.each(databases)("testing insertQuestionnaireIntoRegistry", (databaseName) => {
  let res, req, insertQuestionnaireIntoRegistry, database
  const next = jest.fn()

  beforeAll(() => {
    jest.resetModules()
    process.env.REGISTRY_DATABASE_SOURCE = databaseName
    insertQuestionnaireIntoRegistry = require("./insertQuestionnaireIntoRegistry")
    database = require("../database")
  })

  it(`should add a record into the registry using ${databaseName}`, async () => {
    res = mockResponse()
    req = mockRequest()
    await insertQuestionnaireIntoRegistry(req, res, next)
    const checkData = await database.getQuestionnaire(mockDbCall())
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ message: "Ok" })
    expect(checkData).toEqual(expect.objectContaining({ survey_id: "iqr_test_001", form_type: "O456" }))
  })

  it(`should throw error when sending an incomplete request ${databaseName}`, async () => {
    res = mockResponse()
    req = mockBadRequest()
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {})
    await insertQuestionnaireIntoRegistry(req, res, next)
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ message: "Sorry, something went wrong inserting into the register" })
    spy.mockRestore()
  })
})
