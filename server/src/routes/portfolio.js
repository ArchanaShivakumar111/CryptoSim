import express from 'express';
import { authRequired } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/portfolio', authRequired, async (req, res) => {
  const user = req.user;
  res.json({
    balance: user.balance,
    holdings: user.holdings,
    portfolioHistory: user.portfolioHistory || []
  });
});

router.post('/trade', authRequired, async (req, res) => {
  const db = req.db;
  const user = req.user;
  const { symbol, side, amount, price } = req.body;

  if (!symbol || !side || !amount || !price) {
    return res.status(400).json({ message: 'symbol, side, amount, price required' });
  }

  const qty = Number(amount);
  const tradeValue = qty * Number(price);

  if (side === 'buy') {
    if (user.balance < tradeValue) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }
    user.balance -= tradeValue;
    user.holdings[symbol] = (user.holdings[symbol] || 0) + qty;
  } else if (side === 'sell') {
    if ((user.holdings[symbol] || 0) < qty) {
      return res.status(400).json({ message: 'Insufficient holdings' });
    }
    user.balance += tradeValue;
    user.holdings[symbol] -= qty;
  } else {
    return res.status(400).json({ message: 'Invalid side' });
  }

  const now = new Date();
  const historyEntry = {
    timestamp: now,
    totalValue: user.balance,
    holdingsSnapshot: user.holdings
  };

  const updatedHistory = [...(user.portfolioHistory || []), historyEntry].slice(-100);
  user.portfolioHistory = updatedHistory;

  await db.collection('users').updateOne(
    { _id: user._id },
    {
      $set: {
        balance: user.balance,
        holdings: user.holdings,
        portfolioHistory: user.portfolioHistory
      }
    }
  );

  await db.collection('trades').insertOne({
    userId: user._id,
    symbol,
    side,
    amount: qty,
    price: Number(price),
    value: tradeValue,
    createdAt: now,
  });

  res.json({
    balance: user.balance,
    holdings: user.holdings,
    portfolioHistory: user.portfolioHistory
  });
});

router.get('/trades', authRequired, async (req, res) => {
  const db = req.db;
  const user = req.user;

  const trades = await db
    .collection('trades')
    .find({ userId: user._id })
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();

  res.json(trades);
});

router.get('/profile', authRequired, async (req, res) => {
  const db = req.db;
  const user = req.user;

  const trades = await db
    .collection('trades')
    .find({ userId: user._id })
    .toArray();

  const tradeCount = trades.length;
  const totalVolume = trades.reduce((sum, t) => sum + (t.value || 0), 0);
  const uniqueSymbols = new Set(trades.map((t) => t.symbol)).size;

  const achievements = [
    {
      key: 'first-trade',
      title: 'First Trade',
      description: 'Complete your first simulated trade.',
      unlocked: tradeCount >= 1,
    },
    {
      key: 'ten-trades',
      title: 'Active Trader',
      description: 'Complete 10 or more simulated trades.',
      unlocked: tradeCount >= 10,
    },
    {
      key: 'high-volume',
      title: 'High Roller',
      description: 'Trade over $50,000 total notional volume.',
      unlocked: totalVolume >= 50000,
    },
    {
      key: 'diversified',
      title: 'Diversified Portfolio',
      description: 'Trade at least 3 different coins.',
      unlocked: uniqueSymbols >= 3,
    },
  ];

  res.json({
    id: user._id,
    name: user.name,
    email: user.email,
    balance: user.balance,
    holdings: user.holdings,
    portfolioHistory: user.portfolioHistory || [],
    achievements,
    tradeStats: {
      tradeCount,
      totalVolume,
      uniqueSymbols,
    },
  });
});

export default router;
