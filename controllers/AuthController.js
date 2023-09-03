import DBClient from '../utils/db';
import RedisClient from '../utils/redis';

const sha1 = require('sha1');
const uuid = require('uuid').v4;

class AuthController {
  static async getConnect(req, res) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Extract the base64-encoded email and password
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [email, password] = credentials.split(':');

    // Find the user by email and hashed password
    const hashedPassword = sha1(password); // Hash the provided password
    const user = await DBClient.db.collection('users').findOne({ email, password: hashedPassword });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Generate a random token
    const token = uuid();

    // Store the user ID in Redis with the token as the key for 24 hours
    await RedisClient.set(`auth_${token}`, user._id.toString(), 24 * 60 * 60); // 24 hours in seconds

    return res.status(200).json({ token });
  }

  static async getDisconnect(req, res) {
    const token = req.header('X-Token');

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Retrieve the user ID from Redis
    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Delete the token in Redis
    await RedisClient.del(`auth_${token}`);

    return res.status(204).send();
  }
}

module.exports = AuthController;
