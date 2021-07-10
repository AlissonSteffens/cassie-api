const urlHelper = require('url')
const MongoClient = require('mongodb').MongoClient
let cachedDb = null
const requestIp = require('request-ip')
var validate = require('jsonschema').validate;

// function that connect to the mongo database
// and return the database
async function getDb() {
  // check if the database is already connected
  if (cachedDb) {
    return cachedDb
  }
  const url = process.env.MONGODB_URI
  // get the database name from the url
  const dbName = urlHelper.parse(url).pathname.substr(1)
  //comnnect to the database
  let connection = await MongoClient.connect(url)
  cachedDb = connection.db(dbName)
  // return the database
  return cachedDb
}

// Set the schema for the cookies
var schema = {
  id: "/Cookie",
  type: "object",
  properties: {
    user: { type: "string" },
    email: { type: "string", format: "email" },
    read: { type: "boolean" }
  },
  required: ["read"]
};

// export main function
module.exports = async (req, res) => {
  // get the database  
  const db = await getDb()
  // get the cookies collection
  const collection = await db.collection('cookies')
  // get the keys collection
  const key = await db.collection('keys')

  // allow only POST and GET methods
  if (req.method !== 'POST' && req.method !== 'GET') {
    // if not allowed, return 405 Method not allowed
    res.status(405).send('Method not allowed')
    return
  }

  // allow All origin
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  // handle GET method
  if (req.method === 'GET') {
    // get the first entry from keys collection
    const keyEntry = await key.findOne({})
    // check if the key is equals to the auth key in the header
    if (keyEntry && keyEntry.key === req.headers.authorization) {
      // get the cookies collection
      const cookies = await collection.find({}).toArray()
      // return the cookies
      res.send(cookies)
    } else {
      // if the key is not equals to the auth key in the header return a 401
      res.status(401).send('Unauthorized')
    }
  }

  // handle POST method
  if (req.method === 'POST') {
    // get the body
    let body = await req.body
    // convert the body.read to boolean
    if (body.read) {
      body.read = Boolean(body.read)
    }
    // validate the body with the schema
    const result = validate(body, schema)
    // check if the body is valid
    if (result.valid) {
      // add current date to the body
      body.created = new Date()
      // add client ip to the body
      body.ip = requestIp.getClientIp(req)
      // insert the body in the cookies collection and then return the body if the insert is ok
      const result = await collection.insertOne(body)
      // check if the insert is ok
      if (result.insertedCount === 1) {
        res.send(body)
      } else {
        // if the insert is not ok, return an error
        res.status(500).send('Internal server error')
      }
    } else {
      // if the body is not valid, return the errors
      res.status(400).send('Bad request')
    }
  }

}


