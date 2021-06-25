const url = require('url')
const MongoClient = require('mongodb').MongoClient
let cachedDb = null
const requestIp = require('request-ip')
var validate = require('jsonschema').validate;

async function connectToDatabase(uri) {
  if (cachedDb) {
    return cachedDb
  }
  const config = {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
  const client = await MongoClient.connect(uri, config)
  const db = await client.db(url.parse(uri).pathname.substr(1))
  cachedDb = db
  return db
}

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

module.exports = async (req, res) => {
  
  const db = await connectToDatabase(process.env.MONGODB_URI)
  const collection = await db.collection('cookies')
  const key = await db.collection('keys')

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  
  switch (req.method) {
    case 'GET':
      key.find({}).toArray().then(result => {
        if (result[0].key == req.headers.auth) {
          var limit;
          var page;

          if (req.query.limit) {
            limit = parseInt(req.query.limit); // Make sure to parse the limit to number
            if (limit > 10000) {
              limit = 10000
            }
          } else {
            limit = 10;
          }

          if (req.query.page) {
            page = parseInt(req.query.page);// Make sure to parse the skip to number
          } else {
            page = 0;
          }
          collection.find({}).limit(limit).skip(limit * page).toArray().then(result => {
            res.status(200).json(result)
          })
        } else {
          res.status(401).end("Unauthorized")
        }
      })
      collection.find({}).toArray().then(result => {
        res.status(200).json(result)
      })
      break
    case 'POST':
      const data = req.body
      data.extIp = requestIp.getClientIp(req)
      data.time = Date.now()
      if (data.read) {
        data.read = Boolean(data.read)
      }
      let validation = validate(data, schema)
      if (validation.errors.length === 0) {
        collection.insertOne(data).then(result => {
          collection.findOne(result.insertedId).then(r => {
            res.status(200).json(r)
          })
        })
      } else {
        res.status(400).json(validation.errors)
      }

      break
    default:
      res.setHeader('Allow', ['GET', 'POST'])
      res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}


