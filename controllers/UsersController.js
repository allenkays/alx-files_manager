import DBClient from '../utils/db';
import RedisClient from '../utils/redis';
const { ObjectId } = require('mongodb');
const sha1 = require('sha1');

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    /* Check that email and password are provided */
    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    /* Check is email is already in db */

    const existingUser = await DBClient.db.collection('users').findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Already exist' });
    }

    const hashedPassword = sha1(password);

    const newUser = {
      email,
      password: hashedPassword,
    };

    try {
      const result = await DBClient.db.collection('users').insertOne(newUser);

      const responseUser = {
        email: result.ops[0].email,
        id : result.insertedId
      };

      return res.status(201).json(responseUser);
    } catch (error) {
      console.error('Error creating user:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getMe(req, res) {
    const token = req.header('X-Token');

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('Received Token:', token);
    /* Retrieve the user ID from Redis */
    const userId = await RedisClient.get(`auth_${token}`);
    console.log('Retrieved User ID from Redis:', userId);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await DBClient.db.collection('users').findOne({ _id: ObjectId(userId) });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    return res.status(200).json({ email: user.email, id: user._id.toString() });
  }
}

module.exports = UsersController;
