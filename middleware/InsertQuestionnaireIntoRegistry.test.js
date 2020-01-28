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
      survey_id: "123",
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

describe.each(databases)("testing insertQuestionnaireIntoRegistry", (databaseName) => {
  let res, req, insertQuestionnaireIntoRegistry
  const next = jest.fn()

  beforeAll(() => {
    jest.resetModules()
    process.env.REGISTRY_DATABASE_SOURCE = databaseName
    insertQuestionnaireIntoRegistry = require("./insertQuestionnaireIntoRegistry")
  })

  it(`should add a record into the registry using ${databaseName}`, async () => {
    res = mockResponse()
    req = mockRequest()
    await insertQuestionnaireIntoRegistry(req, res, next)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ message: "Ok" })
  })

  it(`should add a record into the registry using ${databaseName}`, async () => {
    res = mockResponse()
    req = mockRequest()
    await insertQuestionnaireIntoRegistry(req, res, next)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ message: "Ok" })
  })

  it(`should throw error when sending an incomplete request ${databaseName}`, async () => {
    res = mockResponse()
    req = mockBadRequest()
    await insertQuestionnaireIntoRegistry(req, res, next)
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ message: "Sorry, something went wrong inserting into the register" })
  })
})
