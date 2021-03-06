const { Firestore } = require('@google-cloud/firestore')
const { uuid } = require('uuidv4')
const collectionPrefix = process.env.FIRESTORE_COLLECTION_PREFIX || "registry"
const versionCollection = collectionPrefix + "-schema-versions"
const summaryCollection = collectionPrefix + "-schema-summary"

let db
if (process.env.GOOGLE_AUTH_PROJECT_ID) {
  db = new Firestore({
    projectId: process.env.GOOGLE_AUTH_PROJECT_ID
  })
}
else {
  db = new Firestore()
}

const getQuestionnaire = async ({ id, survey_id, form_type, language = "en", version = "0" }) => {
  let docRef, doc

  if (!id && (!survey_id || !form_type)) {
    const newErr = new Error("id or survey_id and form_type not provided in request")
    console.error(newErr)
    throw newErr
  }

  try {
    if (id) {
      docRef = await db.collection(versionCollection).doc(id).collection("registry_schemas").doc(language)
    }
    else {
      if (version === "0") {
        docRef = await getSchemaSummary({ survey_id, form_type })
        doc = await docRef.get()
        if (!doc.exists) {
          throw new Error("record not found")
        }
        version = await doc.data().registry_version
      }
      const queryRef = await db.collection(versionCollection)
        .where("survey_id", "==", survey_id)
        .where("form_type", "==", form_type)
        .where("registry_version", "==", version).limit(1).get()
      if (queryRef.size === 0) {
        throw new Error("record not found")
      }
      docRef = queryRef.docs[0].ref.collection("registry_schemas").doc(language)
    }

    doc = await docRef.get()
    if (!doc.exists) {
      throw new Error("record not found")
    }
    const data = await doc.data()
    return JSON.parse(data.schema)
  }
  catch (e) {
    console.error(e)
    throw new Error("error getting record")
  }
}

const getSchemaSummary = async ({ survey_id, form_type }) => {
  let docRef
  const queryRef = await db.collection(summaryCollection)
    .where("survey_id", "==", survey_id)
    .where("form_type", "==", form_type).limit(1).get()
  if (queryRef.size > 0) {
    docRef = queryRef.docs[0].ref
  }
  else {
    docRef = await db.collection(summaryCollection).doc(uuid())
  }
  return docRef
}

const upsertSchemaVersion = async (summaryDocRef, { survey_id, form_type, qid, language, title }) => {
  let model = {}

  const docRef = await db.collection(versionCollection).doc(qid)
  const docVersion = await docRef.get()
  if (docVersion.exists) {
    model = await docVersion.data()
  }
  else {
    model.languages = []
    model.registry_version = "1"
    const summaryDoc = await summaryDocRef.get()
    if (summaryDoc.exists) {
      const summary_model = await summaryDoc.data()
      model.registry_version = (parseInt(summary_model.registry_version) + 1).toString()
      model.languages = summary_model.languages
    }
  }
  model.survey_id = survey_id
  model.form_type = form_type
  model.qid = qid

  if (!model.languages.includes(language)) {
    model.languages.push(language)
  }
  if (language === "en") {
    model.title = title
  }
  await docRef.set(model)
  return docRef
}

const upsertSchemaLanguage = async (versionDocRef, data) => {
  const docRef = await versionDocRef.collection('registry_schemas').doc(data.language)
  await docRef.set(data)
  return docRef
}

const upsertSchemaSummary = async (summaryDocRef, { survey_id, form_type, language, qid, registry_version, title }) => {
  let languages = []
  let model = {}
  const schemaDoc = await summaryDocRef.get()
  if (schemaDoc.exists) {
    model = await schemaDoc.data()
    languages = model.languages
  }
  if (!languages.includes(language)) {
    languages.push(language)
  }
  model.survey_id = survey_id
  model.form_type = form_type
  model.qid = qid
  model.registry_version = registry_version
  model.languages = languages
  if (language === "en") {
    model.title = title
  }
  await summaryDocRef.set(model)
}

const saveQuestionnaire = async (data) => {
  try {
    if (!data.qid) {
      data.qid = uuid()
    }
    const summaryDocRef = await getSchemaSummary(data)
    const versionDocRef = await upsertSchemaVersion(summaryDocRef, data)
    const versionDoc = await versionDocRef.get()
    data.registry_version = await versionDoc.data().registry_version
    await upsertSchemaLanguage(versionDocRef, data)
    await upsertSchemaSummary(summaryDocRef, data)
  }
  catch (e) {
    console.error(e)
    throw new Error("error saving record")
  }
}

const getQuestionnaireSummary = async (latest) => {
  const attributes = ["survey_id", "form_type", "registry_version", "title", "languages", "qid"]
  let result, colRef
  const response = []

  try {
    if (latest) {
      colRef = await db.collection(summaryCollection).select(...attributes)
    }
    else {
      colRef = await db.collection(versionCollection).select(...attributes)
    }

    result = await colRef.get()
    result.forEach((doc) => {
      response.push(doc.data())
    })

    return response
  }
  catch (e) {
    console.error(e)
    throw new Error("error getting summary")
  }
}

module.exports = { saveQuestionnaire, getQuestionnaire, getQuestionnaireSummary }
