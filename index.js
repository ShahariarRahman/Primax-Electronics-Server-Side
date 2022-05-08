const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ massage: 'Unauthoruzed', status: 401 })
    }
    const token = authorization.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ massage: 'Forbidden', status: 403 })
        }
        console.log('decoded', decoded);
        req.decoded = decoded;
        next()
    });
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dwqxc.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const run = async () => {
    try {
        await client.connect();
        const inventoryCollection = client.db('products').collection('inventory');

        app.post('/login', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1d'
            });
            res.send({ token });
        });

        app.get('/inventory', async (req, res) => {
            const query = {};
            const cursor = inventoryCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });

        app.post('/inventory', async (req, res) => {
            const inventory = req.body;
            const result = await inventoryCollection.insertOne(inventory);
            res.send(result);
        });

        app.delete('/inventory/:id', async (req, res) => {
            const id = req.params;
            const query = { _id: ObjectId(id) }
            const result = await inventoryCollection.deleteOne(query);
            res.send(result);
        });


        app.put('/inventory', async (req, res) => {
            const id = req.query.id;
            const quantity = req.query.quantity;

            const query = { _id: ObjectId(id) }
            const updateDoc = {
                $set: { quantity }
            }
            const result = await inventoryCollection.updateOne(query, updateDoc);
            res.send(result);
        })

        app.get('/myitem', verifyJWT, async (req, res) => {
            const email = req.query?.email;
            const decodedEmail = req.decoded?.email;

            if (email === decodedEmail) {
                const query = { email };
                const cursor = inventoryCollection.find(query);
                const result = await cursor.toArray();
                res.send(result);
            }
            else {
                return res.status(403).send({ massage: 'Forbidden', status: 403 })
            }
        });

    }
    finally {

    }
}

run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('server is running');
});

app.listen(port, () => console.log('Listening port', port));
