const express = require('express');
const cors = require("cors")
const dotenv = require('dotenv')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
dotenv.config()

const uri = process.env.MONGODB_URI;


const app = express()
app.use(cors());
app.use(express.json());
const port = process.env.PORT

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const db = client.db("notepilot-ai");

        const usersCollection = db.collection("users");
        const notesCollection = db.collection("notes");

        // add notes
        app.post("/notes", async (req, res) => {
            try {
                const noteData = req.body;

                const newNote = {
                    ...noteData,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };


                const result = await notesCollection.insertOne(newNote);


                res.status(201).json({
                    success: true,
                    message: "Note added successfully",
                    noteId: result.insertedId
                });


            } catch (error) {
                console.log(error);

                res.status(500).json({
                    success: false,
                    message: "Failed to add note"
                })
            }
        });







        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Notepilot-ai server is running!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})