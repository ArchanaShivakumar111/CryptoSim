import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';
import authRouter from './routes/auth.js';
import portfolioRouter from './routes/portfolio.js';
import marketRouter from './routes/market.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = process.env.DB_NAME || 'cryptosim';

app.use(cors());
app.use(express.json());

let db;

async function connectDB() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  db = client.db(DB_NAME);
  app.locals.db = db;
  console.log('Connected to MongoDB');
}

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'CryptoSim API' });
});

app.use('/api/auth', (req, res, next) => {
  req.db = db;
  next();
}, authRouter);

app.use('/api', (req, res, next) => {
  req.db = db;
  next();
}, portfolioRouter);

app.use('/api/market', (req, res, next) => {
  req.db = db;
  next();
}, marketRouter);

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });
