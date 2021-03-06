const databases = ["dynamo", "firestore", ""]

const mockResponse = () => {
  const res = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

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

const mockModel = () => {
  const model = {
    author_id: "678",
    survey_id: "001",
    form_type: "ONS",
    date_published: Date.now(),
    survey_version: "1",
    schema: JSON.stringify({ eq_id: "456", test: "test123" }),
    title: "A test",
    language: "en",
    runner_version: "v2"
  }
  return model
}

describe.each(databases)("testing getQuestionnaireFromRegistry", (databaseName) => {
  let res, req, getQuestionnaireFromRegistry, database
  const next = jest.fn()

  beforeAll(async () => {
    jest.resetModules()
    process.env.REGISTRY_DATABASE_SOURCE = databaseName
    process.env.GOOGLE_AUTH_PROJECT_ID = "test-project"
    getQuestionnaireFromRegistry = require("./getQuestionnaireFromRegistry")
    database = require("../database")
    await database.saveQuestionnaire(mockModel())
  })

  it(`should get the latest record from the registry using ${databaseName}`, async () => {
    res = mockResponse()
    req = mockRequest()
    await getQuestionnaireFromRegistry(req, res, next)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toBeCalledWith(expect.objectContaining({ eq_id: "456", test: "test123" }))
  })

  it(`should get a specific version from the registry using ${databaseName}`, async () => {
    res = mockResponse()
    req = mockRequest()
    req.body.version = "1"
    await getQuestionnaireFromRegistry(req, res, next)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toBeCalledWith(expect.objectContaining({ eq_id: "456", test: "test123" }))
  })

  it(`should return 500 and message when not record not found using ${databaseName}`, async () => {
    res = mockResponse()
    req = mockRequest()
    req.body.survey_id = "abc"
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    await getQuestionnaireFromRegistry(req, res, next)
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ message: "error getting record" })
    spy.mockRestore()
  })

  it(`should throw an error getting record when missing key fields ${databaseName}`, async () => {
    req = {}
    res = mockResponse()
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    await getQuestionnaireFromRegistry(req, res, next)
    spy.mockRestore()
  })
})
