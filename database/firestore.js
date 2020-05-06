const { Firestore } = require('@google-cloud/firestore')
const { uuid } = require('uuidv4')

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
      docRef = await db.collection("schema_versions").doc(id).collection("languages").doc(language)
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
      const queryRef = await db.collectionGroup('languages')
        .where("survey_id", "==", survey_id)
        .where("form_type", "==", form_type)
        .where("language", "==", language || "en")
        .where("registry_version", "==", version).limit(1).get()
      if (queryRef.size === 0) {
        throw new Error("record not found")
      }
      docRef = queryRef.docs[0].ref
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
  const queryRef = await db.collection('schema_summary')
    .where("survey_id", "==", survey_id)
    .where("form_type", "==", form_type).limit(1).get()
  if (queryRef.size > 0) {
    docRef = queryRef.docs[0].ref
  }
  else {
    docRef = await db.collection('schema_summary').doc(uuid())
  }
  return docRef
}

const upsertSchemaVersion = async (schemaDocRef, { survey_id, form_type, qid }) => {
  const docRef = await db.collection('schema_versions').doc(qid)
  const docVersion = await docRef.get()
  if (!docVersion.exists) {
    const schemaDoc = await schemaDocRef.get()
    let currentVersionNumber = "0"
    if (schemaDoc.exists) {
      currentVersionNumber = await schemaDoc.data().registry_version
    }
    const nextVersionNumber = (parseInt(currentVersionNumber) + 1).toString()
    await docRef.set({
      survey_id,
      form_type,
      registry_version: nextVersionNumber
    })
  }
  return docRef
}

const upsertSchemaLanguage = async (schemaVersionDocRef, data) => {
  const docRef = await schemaVersionDocRef.collection('languages').doc(data.language)
  await docRef.set(data)
  return docRef
}

const upsertSchemaSummary = async (schemaDocRef, { survey_id, form_type, language, qid, registry_version, title }) => {
  let languages = []
  let model = {}
  const schemaDoc = await schemaDocRef.get()
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
  await schemaDocRef.set(model)
}

const saveQuestionnaire = async (data) => {
  try {
    if (!data.qid) {
      data.qid = uuid()
    }
    const schemaDocRef = await getSchemaSummary(data)
    const versionDocRef = await upsertSchemaVersion(schemaDocRef, data)
    const versionDoc = await versionDocRef.get()
    data.registry_version = await versionDoc.data().registry_version
    await upsertSchemaLanguage(versionDocRef, data)
    await upsertSchemaSummary(schemaDocRef, data)
  }
  catch (e) {
    console.error(e)
    throw new Error("error saving record")
  }
}

const getQuestionnaireSummary = async (latest) => {
  const attributes = ["survey_id", "form_type", "registry_version", "title", "language", "qid"]
  let result, colRef
  const response = []

  try {
    if (latest) {
      colRef = await db.collection('schema_summary').select(...attributes)
    }
    else {
      colRef = await db.collectionGroup('languages').select(...attributes)
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
