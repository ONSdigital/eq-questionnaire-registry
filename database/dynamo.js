const dynamoose = require("dynamoose")
const { uuid } = require('uuidv4')
let throughput = "ON_DEMAND"
let registryTableName = "questionnaire-registry"

if (process.env.DYNAMODB_ENDPOINT_OVERRIDE) {
  dynamoose.local(process.env.DYNAMODB_ENDPOINT_OVERRIDE)
  throughput = { read: 10, write: 10 } // DynamoDB local doesn't yet support on-demand
}

if (process.env.DYNAMO_QUESTIONNAIRE_REGISTRY_TABLE_NAME) {
  registryTableName = process.env.DYNAMO_QUESTIONNAIRE_REGISTRY_TABLE_NAME
}

const registrySchema = new dynamoose.Schema(
  {
    id: {
      type: String,
      hashKey: true,
      required: true
    },
    sort_key: {
      type: String,
      required: true,
      rangeKey: true
    },
    author_id: {
      type: String,
      required: true
    },
    survey_id: {
      type: String,
      required: true
    },
    form_type: {
      type: String,
      required: true
    },
    registry_version: {
      type: String,
      required: true
    },
    qid: {
      type: String,
      required: true,
      index: {
        global: true,
        rangeKey: 'language',
        project: true,
        throughput: throughput
      }
    },
    language: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    runner_version: {
      type: String,
      required: true
    },
    survey_version: {
      type: String,
      required: true
    },
    schema: {
      type: Object,
      require: true
    }
  },
  {
    throughput: throughput,
    timestamps: true
  }
)

const RegistryModel = dynamoose.model(
  registryTableName,
  registrySchema
)

const getQuestionnaire = async (params) => {
  let data
  if (!params.id && (!params.survey_id || !params.form_type)) {
    const newErr = new Error("id or survey_id and form_type not provided in request")
    console.log(newErr)
    throw newErr
  }
  try {
    if (params.id) {
      const qid = `${params.id}`
      const language = `${params.language || "en"}`
      data = await RegistryModel.queryOne({ qid: qid, language: language }).exec()
    }
    else {
      const id = `${params.survey_id}_${params.form_type}_${params.language || "en"}`
      const sortKey = `${params.version || "0"}`
      data = await RegistryModel.get({ id: id, sort_key: sortKey })
    }

    if (data) {
      return JSON.parse(data.schema)
    }
    return
  }
  catch (e) {
    console.log(e)
    throw new Error("error getting record")
  }
}

const saveQuestionnaire = async (data) => {
  if (!data.qid) {
    data.qid = uuid()
  }
  data.id = `${data.survey_id}_${data.form_type}_${data.language}`
  data.sort_key = `0`
  const currentModel = await RegistryModel.get({ id: data.id, sort_key: data.sort_key })
  try {
    if (currentModel) {
      data.registry_version = (parseInt(currentModel.registry_version) + 1).toString()
    }
    else {
      data.registry_version = "1"
    }
    const modelLatest = new RegistryModel(data)
    await modelLatest.save()
    data.sort_key = `${data.registry_version}`
    const modelVersion = new RegistryModel(data)
    await modelVersion.save()
  }
  catch (e) {
    console.log(e)
    throw new Error("error saving record")
  }
}

const getQuestionnaireSummary = async (latest) => {
  let data
  const attributes = ["id", "sort_key", "survey_id", "form_type", "registry_version", "title", "language", "qid"]
  try {
    if (latest) {
      data = await RegistryModel.scan('sort_key').eq("0").attributes(attributes).exec()
    }
    else {
      data = await RegistryModel.scan('sort_key').not().eq("0").attributes(attributes).exec()
    }
  }
  catch (e) {
    console.log(e)
    throw new Error("error getting summary")
  }
  return JSON.parse(JSON.stringify(data))
}

module.exports = { getQuestionnaire, saveQuestionnaire, getQuestionnaireSummary }
