const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
var mongodb = require("mongodb");

var ObjectID = mongodb.ObjectID;
var PLACES_COLLECTION = "places"




const app = express()
app.use(morgan('combined'))
app.use(bodyParser.json())
app.use(cors())
app.use(compression())

let db;

mongodb.MongoClient.connect(process.env.MONGODB_URI, function (err, database) {
    if (err) {
        console.log(err);
        process.exit(1);
    }

    // Save database object from the callback for reuse.
    db = database.db("projectmaps");
    console.log("Database connection ready");

    // Initialize the app.
    const server = app.listen(process.env.PORT || 8000, function () {
        const port = server.address().port;
        console.log("App now running on port", port);
    });
})

function handleError(res, reason, message, code) {
    console.log("ERROR: " + reason);
    res.status(code || 500).json({"error": message});
}


app.get('/places/:id', (req, res) => {
    db.collection(PLACES_COLLECTION).findOne({ _id: new ObjectID(req.params.id) }, function(err, doc) {
        if (err) {
            handleError(res, err.message, "Failed to get place");
        } else {
            res.status(200).json(doc);
        }
    });
  })

app.put('/places/:id', (req, res) => {
    var updateDoc = req.body;
    console.log(updateDoc)
    delete updateDoc._id;

    db.collection(PLACES_COLLECTION).updateOne({_id: new ObjectID(req.params.id)}, {$set:updateDoc}, {upsert:true},function(err, doc) {
        if (err) {
            handleError(res, err.message, "Failed to update place");
        } else {
            res.status(204).end();
        }
    });
})

app.delete('/places/:id', (req, res) => {
    db.collection(PLACES_COLLECTION).deleteOne({_id: new ObjectID(req.params.id)}, function(err, result) {
        if (err) {
            handleError(res, err.message, "Failed to delete place");
        } else {
            res.status(204).end();
        }
    });
})

app.get('/places', (req, res) => {
    db.collection(PLACES_COLLECTION).find({},{projection:{_id:1,name:1,done:1}}).toArray(function(err, docs) {
        if (err) {
            handleError(res, err.message, "Failed to get places.");
        } else {
            res.status(200).json(docs);
        }
    });
})

app.post('/places', (req, res) => {
    const newPlace = req.body;
    newPlace["createDate"] = new Date();

    db.collection(PLACES_COLLECTION).insertOne(newPlace, function(err, doc) {
        if (err) {
            handleError(res, err.message, "Failed to create new place.");
        } else {
            res.status(200).json(doc.ops[0]);
        }
    });
})




app.get('/', (req, res) => {
    res.send("hello");
});