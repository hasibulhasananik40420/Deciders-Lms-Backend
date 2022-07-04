const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const cors = require('cors');
const port = process.env.PORT || 5000;
const app = express()
const jwt = require('jsonwebtoken');
// middleware
const corsConfig = {
    origin: "*",
}
app.use(cors(corsConfig))
app.use(express.json())


const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASSWORD}@cluster0.4dipf.mongodb.net/?retryWrites=true&w=majority`
const client = new MongoClient(uri);


//jwt 
function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization
    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthrized access' })
    }
    const token = authHeader.split(' ')[1]

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbiden access' })
        }
        req.decoded = decoded
        next()
    });
}

async function run() {
    try {
        await client.connect();
        const UserCollection = client.db("UserCollection");
        const LessonsCollection = client.db("LessonsCollection");
        const NotificationCollections = client.db("NotificationCollections");
        const ReviewCollection = client.db("ReviewCollection");
        const users = UserCollection.collection("users");
        const Lessons = LessonsCollection.collection("Lessons");
        const offers = NotificationCollections.collection("offers");
        const accouncment = NotificationCollections.collection("accouncment");
        const review = NotificationCollections.collection("review");

        app.get('/', (req, res) => {
            res.send('Deciders LMS Server is Running')
        })
        // ------------------------------ 
        // User Related Api
        // --------------------------------------------------------

        //save all users on database
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email
            const user = req.body
            const filter = { email: email }
            const options = { upsert: true };
            const updateDoc = {
                $set: user
            }

            const result = await users.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
            res.send({ result, token })

        })

        //admin role set 
        app.put('/makeadmin/:email', async (req, res) => {
            const email = req.params
            const filter = { email: email.email }
            const updateDoc = {
                $set: { role: 'admin' }
            }


            const result = await users.updateOne(filter, updateDoc);
            res.send(result)
        })


        //teacher role set
        app.put('/maketeacher/:email', async (req, res) => {
            const email = req.params
            const filter = { email: email.email }
            const updateDoc = {
                $set: { role: 'teacher' }
            }
            console.log(updateDoc);
            const result = await users.updateOne(filter, updateDoc);
            res.send(result)
        })




        // get All Users
        app.get('/users', async (req, res) => {
            const quary = {}
            const cursor = await users.find(quary).toArray()
            res.send(cursor)
        })

        //delete user by id
        app.delete('/delete/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const result = await users.deleteOne(query)
            res.send(result)

        })


        //

        // get My Profile Data by email address
        app.get('/myprofile/:email', async (req, res) => {
            const email = req.params
            const quary = { email: email.email }
            const cursor = await users.find(quary).toArray()
            res.send(cursor)
        })

        // get All Students
        app.get('/allstudents', async (req, res) => {
            const quary = {}
            const cursor = await users.find(quary).toArray()
            res.send(cursor)
        })
        // get All Teachers
        app.get('/allteachers', async (req, res) => {
            const quary = { role: 'teacher' }
            const cursor = await users.find(quary).toArray()
            res.send(cursor)
        })
        // get All Admins
        app.get('/alladmins', async (req, res) => {
            const quary = { role: 'admin' }
            const cursor = await users.find(quary).toArray()
            res.send(cursor)
        })

        // Save Profile Data  
        app.put('/profiledata/:email', verifyJWT, async (req, res) => {
            const email = req.params.email
            const filter = { email: email }
            const profileData = req.body
            const options = { upsert: true };
            const updateDoc = {
                $set: profileData
            }

            const result = await users.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
            res.send({ result, token })
        })

        //-------------------------------------------------
        //  store all review

        app.post('/addreviews', async (req, res) => {
            const addReviews = req.body
            const result = await review.insertOne(addReviews)
            res.send(result)
        })


        //  get all review

        app.get('allreview', async (req, res) => {
            const allreview = await review.find().toArray()
            res.send(allreview)

        })










        // ------------------------------ 
        // Lessons Api
        // --------------------------------------------------------

        // get All Lessons
        app.get('/alllessons', async (req, res) => {
            const quary = {}
            const cursor = await Lessons.find(quary).toArray()
            res.send(cursor)
        })


        // get All Lesson by Tag Name
        app.get('/lessons/:tag', async (req, res) => {
            const tag = req.params
            const quary = { tag: tag.tag }
            const cursor = await Lessons.find(quary).toArray()
            res.send(cursor)

        })

        // Get a lesson by lessonName
        app.get('/lesson/:lessonname', async (req, res) => {
            const lessonname = req.params
            const quary = { lessonName: lessonname.lessonname }
            const cursor = await Lessons.find(quary).toArray()
            res.send(cursor)

        })


        // ------------------------------------
        // Announcment and offers API    
        // -----------------------------------------------
        // Get all Offers
        app.get('/offers', async (req, res) => {
            const quary = {}
            const result = await offers.find(quary).toArray()
            const cursor = result.reverse()
            res.send(cursor)

        })
        // Post a  Offers
        app.post('/addoffers', async (req, res) => {
            const offerData = req.body
            const result = await offers.insertOne(offerData)
            res.send(result)

        })
        app.get('/announcments', async (req, res) => {
            const quary = {}
            const result = await accouncment.find(quary).toArray()
            const cursor = result.reverse()
            res.send(cursor)

        })
        // Post a  Announcment
        app.post('/addannouncment', async (req, res) => {
            const offerData = req.body
            const result = await accouncment.insertOne(offerData)
            res.send(result)

        })




    } finally {
        //   await client.close();
    }
}
run().catch(console.dir);





app.listen(port, () => {
    console.log("server is  running on ", port);
})