const { Firestore } = require('@google-cloud/firestore')
const { uuid } = require('uuidv4')

let db
if (process.env.GOOGLE_AUTH_PROJECT_ID) {
  db = new Firestore({
    projectId: process.env.GOOGLE_AUTH_PROJECT_ID
    // keyFilename: '../test_firestore_account.json'
  })
}
else {
  db = new Firestore()
}

const getQuestionnaire = async (params) => {
  let docRef, doc

  if (!params.id && (!params.survey_id || !params.form_type)) {
    const newErr = new Error("id or survey_id and form_type not provided in request")
    console.log(newErr)
    throw newErr
  }

  try {
    if (params.id) {
      docRef = await db.collection("schema_versions").doc(params.id).collection("languages").doc(params.language || "en")
    }
    else {
      if (!params.version) {
        docRef = await getSchemaSummary(params)
        doc = await docRef.get()
        if (!doc.exists) {
          return
        }
        params.version = await doc.data().registry_version
      }
      const queryRef = await db.collectionGroup('languages')
        .where("survey_id", "==", params.survey_id)
        .where("form_type", "==", params.form_type)
        .where("language", "==", params.language || "en")
        .where("registry_version", "==", params.version).limit(1).get()
      if (queryRef.size === 0) {
        return
      }
      docRef = queryRef.docs[0].ref
    }

    doc = await docRef.get()
    if (!doc.exists) {
      return
    }
    const data = await doc.data()
    return JSON.parse(data.schema)
  }
  catch (e) {
    console.log(e)
    throw new Error("error getting record")
  }
}

const getSchemaSummary = async (data) => {
  let docRef
  const queryRef = await db.collection('schema_summary')
    .where("survey_id", "==", data.survey_id)
    .where("form_type", "==", data.form_type).limit(1).get()
  if (queryRef.size > 0) {
    docRef = queryRef.docs[0].ref
  }
  else {
    docRef = await db.collection('schema_summary').doc(uuid())
  }
  return docRef
}

const upsertSchemaVersion = async (schemaDocRef, data) => {
  const docRef = await db.collection('schema_versions').doc(data.qid)
  const docVersion = await docRef.get()
  if (!docVersion.exists) {
    const schemaDoc = await schemaDocRef.get()
    let currentVersionNumber = "0"
    if (schemaDoc.exists) {
      currentVersionNumber = await schemaDoc.data().registry_version
    }
    const nextVersionNumber = (parseInt(currentVersionNumber) + 1).toString()
    await docRef.set({
      survey_id: data.survey_id,
      form_type: data.form_type,
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

const upsertSchemaSummary = async (schemaDocRef, data) => {
  let languages = []
  let model = {}
  const schemaDoc = await schemaDocRef.get()
  if (schemaDoc.exists) {
    model = await schemaDoc.data()
    languages = model.languages
  }
  if (!languages.includes(data.language)) {
    languages.push(data.language)
  }
  model.survey_id = data.survey_id
  model.form_type = data.form_type
  model.qid = data.qid
  model.registry_version = data.registry_version
  model.languages = languages
  if (data.language === "en") {
    model.title = data.title
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
    console.log(e)
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
  }
  catch (e) {
    console.log(e)
    throw new Error("error getting summary")
  }

  result.forEach((doc) => {
    response.push(doc.data())
  })

  return response
}

module.exports = { saveQuestionnaire, getQuestionnaire, getQuestionnaireSummary }
