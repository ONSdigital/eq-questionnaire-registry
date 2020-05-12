const databases = ["firestore", "dynamo"]
process.env.DYNAMO_QUESTIONNAIRE_REGISTRY_TABLE_NAME = "questionnaire-registry"
const mockModel = () => {
  return {
    author_id: "123",
    survey_id: "db_test_001",
    form_type: "123",
    survey_version: "1",
    schema: JSON.stringify({ eq_id: "eqid_001", schema_version: "1", title: "test" }),
    title: "test",
    language: "en",
    runner_version: "v1"
  }
}

const mockRequest = () => {
  return {
    survey_id: "db_test_001",
    language: "en",
    form_type: "123"
  }
}

describe.each(databases)("testing database modules", (databaseName) => {
  let model, req, database, data

  beforeAll(async () => {
    jest.resetModules()
    process.env.REGISTRY_DATABASE_SOURCE = databaseName
    database = require(".")
    req = mockRequest()
    model = mockModel()
    model.qid = "db_qid_001"
    await database.saveQuestionnaire(model)
    model.schema = JSON.stringify({ eq_id: "eqid_002", schema_version: "2", title: "test" })
    model.qid = "db_qid_002"
    await database.saveQuestionnaire(model)
  })

  it(`should save a schema into the database using ${databaseName}`, async () => {
    expect(async () => {
      model.qid = "db_qid_003"
      model.form_type = "678"
      await database.saveQuestionnaire(model)
    }).not.toThrow()
  })

  it(`should retrieve the latest version using ${databaseName}`, async () => {
    data = await database.getQuestionnaire(req)
    expect(data).toMatchObject({ eq_id: "eqid_002", title: "test" })
    expect(data).toMatchObject({ schema_version: "2" })
  })

  it(`should retrieve a specific version using ${databaseName}`, async () => {
    req.version = "1"
    data = await database.getQuestionnaire(req)
    expect(data).toMatchObject({ eq_id: "eqid_001", title: "test" })
    expect(data).toMatchObject({ schema_version: "1" })
  })

  it(`should retrieve a specific version using id using ${databaseName}`, async () => {
    req = { id: "db_qid_002" }
    data = await database.getQuestionnaire(req)
    expect(data).toMatchObject({ eq_id: "eqid_002", title: "test" })
    expect(data).toMatchObject({ schema_version: "2" })
  })

  it(`should throw an error getting record when missing key fields ${databaseName}`, async () => {
    const badReq = {}
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    expect(database.getQuestionnaire(badReq)).rejects.toEqual(new Error("id or survey_id and form_type not provided in request"))
    spy.mockRestore()
  })

  it(`should retieve a list of latest schema version using ${databaseName}`, async () => {
    data = await database.getQuestionnaireSummary(true)
    expect(data).toEqual(expect.not.arrayContaining([expect.objectContaining({ qid: "db_qid_001" })]))
    expect(data).toEqual(expect.arrayContaining([expect.objectContaining({ qid: "db_qid_002" })]))
  })

  it(`should retieve a list of all schema version using ${databaseName}`, async () => {
    data = await database.getQuestionnaireSummary(false)
    expect(data).toEqual(expect.arrayContaining([expect.objectContaining({ qid: "db_qid_001" })]))
    expect(data).toEqual(expect.arrayContaining([expect.objectContaining({ qid: "db_qid_002" })]))
  })
})
