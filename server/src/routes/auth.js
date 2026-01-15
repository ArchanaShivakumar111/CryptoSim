import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();

function createToken(user) {
  const payload = { id: user._id.toString(), email: user.email };
  return jwt.sign(payload, process.env.JWT_SECRET || 'devsecret', { expiresIn: '7d' });
}

router.post('/signup', async (req, res) => {
  const db = req.db;
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const existing = await db.collection('users').findOne({ email });
  if (existing) {
    return res.status(409).json({ message: 'Email already registered' });
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = {
    name,
    email,
    password: hashed,
    createdAt: new Date(),
    balance: 10000,
    holdings: {
      BTC: 0,
      ETH: 0,
      USDT: 0,
      BNB: 0,
      SOL: 0
    },
    portfolioHistory: []
  };

  const result = await db.collection('users').insertOne(user);
  const savedUser = { ...user, _id: result.insertedId };
  const token = createToken(savedUser);

  res.status(201).json({
    token,
    user: {
      id: savedUser._id,
      name: savedUser.name,
      email: savedUser.email,
      balance: savedUser.balance,
      holdings: savedUser.holdings
    }
  });
});

router.post('/login', async (req, res) => {
  const db = req.db;
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = await db.collection('users').findOne({ email });
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = createToken(user);

  res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      balance: user.balance,
      holdings: user.holdings
    }
  });
});

export default router;
