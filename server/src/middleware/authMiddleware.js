import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

export async function authRequired(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = header.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');
    const db = req.db;
    const user = await db
      .collection('users')
      .findOne({ _id: new ObjectId(decoded.id) });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({ message: 'Invalid token' });
  }
}
