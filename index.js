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


        // manage notes
        app.get("/notes", async (req, res) => {

            try {

                const {
                    search,
                    category,
                    date,
                    sort,
                    page = 1,
                    limit = 8
                } = req.query;


                let query = {};

                const currentPage = parseInt(page);
                const perPage = parseInt(limit);

                const skip = (currentPage - 1) * perPage;


                // Search by title and description
                if (search) {

                    query.$or = [
                        {
                            title: {
                                $regex: search,
                                $options: "i"
                            }
                        },
                        {
                            shortDescription: {
                                $regex: search,
                                $options: "i"
                            }
                        }
                    ];

                }

                // Category filter
                if (category && category !== "All") {
                    query.category = category;
                }

                // Date filter
                if (date) {

                    const now = new Date();

                    let startDate;

                    if (date === "today") {

                        startDate = new Date();

                        startDate.setHours(0, 0, 0, 0);

                    }

                    if (date === "this-week") {

                        startDate = new Date();

                        startDate.setDate(
                            now.getDate() - 7
                        );

                    }
                    if (date === "this-month") {

                        startDate = new Date();

                        startDate.setMonth(
                            now.getMonth() - 1
                        );

                    }
                    if (startDate) {

                        query.createdAt = {
                            $gte: startDate
                        };

                    }

                }

                // Sorting
                let sortOption = {
                    createdAt: -1
                };
                if (sort === "oldest") {

                    sortOption = {
                        createdAt: 1
                    };

                }
                // Total matching notes
                const totalNotes = await notesCollection.countDocuments(query);

                // Paginated notes
                const notes = await notesCollection
                    .find(query)
                    .sort(sortOption)
                    .skip(skip)
                    .limit(perPage)
                    .toArray();

                res.send({
                    notes,
                    totalNotes,
                    currentPage,
                    totalPages: Math.ceil(totalNotes / perPage),
                });


            } catch (error) {

                console.log(error);
                res.status(500).send({

                    success: false,
                    message: "Failed to fetch notes"

                });

            }

        });

        // manage notes by email
        app.get("/my-notes", async (req, res) => {
            try {
                const { email } = req.query;

                if (!email) {
                    return res.status(400).send({
                        success: false,
                        message: "Email is required",
                    });
                }

                const notes = await notesCollection
                    .find({
                        "author.email": email,
                    })
                    .sort({
                        createdAt: -1,
                    })
                    .toArray();

                res.send(notes);

            } catch (error) {
                console.log(error);

                res.status(500).send({
                    success: false,
                    message: error.message,
                });
            }
        });


        // delete notes
        app.delete("/notes/:id", async (req, res) => {
            try {

                const id = req.params.id;

                const query = {
                    _id: new ObjectId(id)
                };

                const result = await notesCollection.deleteOne(query);

                if (result.deletedCount === 0) {
                    return res.status(404).send({
                        success: false,
                        message: "Note not found"
                    });
                }

                res.send({
                    success: true,
                    message: "Note deleted successfully"
                });

            } catch (error) {

                console.log(error);

                res.status(500).send({
                    success: false,
                    message: "Failed to delete note"
                });

            }
        });

        // note details
        app.get("/notes/:id", async (req, res) => {
            try {
                const id = req.params.id;

                const note = await notesCollection.findOne({
                    _id: new ObjectId(id)
                });

                if (!note) {
                    return res.status(404).send({
                        message: "Note not found"
                    });
                }

                res.send(note);

            } catch (error) {
                res.status(500).send({
                    message: error.message
                });
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