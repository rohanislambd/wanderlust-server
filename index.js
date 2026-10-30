import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import 'dotenv/config';
import cors from 'cors'
import { createRemoteJWKSet, jwtVerify } from 'jose';

const app = express();
const PORT = 8000;

// cors
app.use(cors());
// Parse incoming JSON data
app.use(express.json())

// connect data base

const client = new MongoClient(process.env.MONGODB_URI);

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}

const mogoClient = await connectToMongoDB();
const db = mogoClient.db("wanderlust");
const destinationCollection = db.collection('destination');
const bookingCollection = db.collection("bookings")


//midleware
 const verifyToken = async(req, res, next)=>{
  const authHeader = req.headers.authorization
  
  if(!authHeader){
    return res.status(401).send({mes: "Unauthrized!"})
  }

  const token = authHeader.split(" ")[1]
  if(!token){
     return res.status(401).send({mes: "Unauthrized!"})
  }

  const JWKS = createRemoteJWKSet(
    new URL("http://localhost:3000/api/auth/jwks")
  )

  try {
     const {payload} = await jwtVerify(token, JWKS)
     next()
  } catch (error) {
    return res.status(500).send({mes: "Server Error!"})
  }
 
 
  
}


// Receive data from the frontend
app.post('/add-destination', async(req, res)=>{
  const data = req.body;
  const result =await destinationCollection.insertOne(data);
  res.send(result)
});

// Get all destinations from the database
app.get('/destinations', async(req, res)=>{
  const result = await destinationCollection.find().toArray();
  res.send(result);
});

//destinations detail page api
app.get('/destination/:id', verifyToken, async(req, res)=>{

  const {id} = req.params;
  const result = await destinationCollection.findOne({_id: new ObjectId(id)})
  res.send(result)
})


//Update destinations api
app.patch('/destination/:id', async(req, res) => {
  const {id} = req.params;
  const updatedData = req.body;
  const result  = await destinationCollection.updateOne(
    {_id: new ObjectId(id)},
    {$set:updatedData}
  )
  res.status(200).send(result)
})
//Delete destination api
app.delete('/destination/:id', async(req, res) =>{
  const {id} = req.params;
  const result = await destinationCollection.deleteOne({_id: new ObjectId(id)});
  res.send(result)
})

http://localhost:8000/booking
app.get('/', (req, res) =>{
    res.send({message:'Server is runing fine!'})
})


// Receive data from the frontend
app.post('/booking', async(req, res) =>{
  const data = req.body;
  const result = await bookingCollection.insertOne(data);
  res.send(result)
})

app.get('/my-booking/:email', async(req, res) => {
  const {email} = req.params;
  const result = await bookingCollection.find({email: email}).toArray();
  res.send(result)
})

//booking cencel 
app.delete('/my-bookings/:id', async(req, res) => {
  const {id} = req.params;
  const result = await bookingCollection.deleteOne({_id: new ObjectId(id)});
  res.send(result)
})

app.listen(PORT, ()=>{
    console.log(`Server is runnig at ${PORT}`);
})