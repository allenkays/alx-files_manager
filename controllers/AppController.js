import DBClient from '../utils/db';
import RedisClient from '../utils/redis';

class AppController {
  static async getStatus(req, res) {
    try {
      const redisStatus = RedisClient.isAlive();
      const dbStatus = DBClient.isAlive();

      const response = {
        redis: redisStatus,
        db: dbStatus,
      };

      return res.status(200).json(response);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getStats(req, res) {
    try {
      const usersCount = await DBClient.nbUsers();
      const filesCount = await DBClient.nbFiles();

      const response = {
        users: usersCount,
        files: filesCount,
      };

      return res.status(200).json(response);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

module.exports = AppController;
