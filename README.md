## eq-survey-register

This service acts as a register of surveys published from the eq-author service.

### Build and Run

Dependencies in this project are managed by yarn. To install all required packages run:

`$ yarn install`

In order to run this service locally the docker compose file contains all the necessary configuration. Start it using:

`$ docker-compose up` (passing in the --build flag if first time setup)

Your code changes will be monitored and nodemon will restart when changes are detected.

### Running in the IDE

If you want to run the application in your ide to take advantage of debugging and break point. create a dotenv file in the root
using the variables listed below.

```
AWS_REGION=eu-west-1
AWS_ACCESS_KEY_ID=dummy
AWS_SECRET_ACCESS_KEY=dummy
NODE_ENV=development
PUBLISHER_URL=http://localhost:9000/publish/
DYNAMODB_ENDPOINT_OVERRIDE=http://localhost:8090
FIRESTORE_EMULATOR_HOST=localhost:8200
FIRESTORE_PROJECT_ID=test-project
GOOGLE_AUTH_PROJECT_ID=test-project
DATABASE=firestore
```

You can start a local docker image for either a Dynamo or Firestore database by calling:


`$ docker-compose up firestore` or `$ docker-compose up dynamo`


set the enviroment variable to either dynamo or firebase in your .env file


### Running tests

The test script will fire up both docker and firestore docker conatainer and run all the tests. To use run:

`$ yarn test` 

### linting
A linting file is included for ESlint. If your editor is configured it should show linting errors. To run use:

`$ yarn lint`

To fix linting errors gloabally use:

`$ yarn lint --fix`


## Rest API description

The REST API is exposed with the following endpoints

```
/questionnaires
/questionnaires-json
/questionnaires/:id
/questionnaires/:id/languages/:language
/surveys/:survey_id/form-types/:form_type
/surveys/:survey_id/form-types/:form_type/languages/:language
/surveys/:survey_id/form-types/:form_type/versions/:version
/surveys/:survey_id/form-types/:form_type/languages/:language/versions/:version
/status
```

### questionnnaires(post)
gets a schema from publisher using the author id and inserts it into the registry, 
include the following in the body of the json request.


```
[
	{
	"survey_id": "XXXX",
	"form_type": "XXXX",
	"schemas" : [
		{"language": "XX",
		"theme": "XXX",
		"author_id": "XXXX"},
		{"language": "XX",
		"theme": "XXX",
		"author_id": "XXXX"}
	]},
	{
	"survey_id": "XXXX",
	"form_type": "XXXX",
	"schemas" : [
		{"language": "XX",
		"theme": "XXX",
		"author_id": "XXXX"}
	]}
]
```
These values are provided by author, hence the camel case attributes.

### questionnnaires-json(post)
inserts the provided schema into the registry. include the following in the body of the json request.

```
{
  "survey_id":"123",
  "form_type":"456",
  "survey_version":"1", 
  "language":"en",
  "runner_version": "v2",
  "schema":{"title":"A test", "eq_id":"258"}
}
```
*runner version and language are optional


### retrieve
Gets the schema from the registry. include the following in the body of the json request.
version and language are optional. if not provided the latest english(en) version is returned.

```
{
  "survey_id":"126",
  "form_type":"456",
  "version":"1",
  "language":"en"
}
```

### summaries
These endpoints return a list of the schema details (not the actual schemas).

questionnaires - lists the most recent versions.

questionnaires-versions - Lists all versions of all schemas held in the registry.


---

