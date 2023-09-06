import DBClient from '../utils/db';
import RedisClient from '../utils/redis';

const { ObjectId } = require('mongodb');
const uuid = require('uuid').v4;
const fs = require('fs');
const path = require('path');

class FilesController {
  static async postUpload(req, res) {
    const userId = await RedisClient.get(`auth_${req.header('X-Token')}`);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      name, type, parentId = '0', isPublic = false, data,
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }

    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }

    if (type !== 'folder' && !data) {
      return res.status(400).json({ error: 'Missing data' });
    }

    if (parentId !== '0') {
      const parentFile = await DBClient.db.collection('files').findOne({
        _id: ObjectId(parentId),
        type: 'folder',
      });

      if (!parentFile) {
        return res.status(400).json({ error: 'Parent not found' });
      }
    }

    const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const filename = uuid();
    const localPath = path.join(folderPath, filename);

    /* Store the file locally (for non-folder types) */
    if (type !== 'folder') {
      const fileData = Buffer.from(data, 'base64');
      fs.writeFileSync(localPath, fileData);
    }

    /* Create a new file document in the collection */
    const newFile = {
      userId,
      name,
      type,
      isPublic,
      parentId,
      localPath: type !== 'folder' ? localPath : null,
    };

    const result = await DBClient.db.collection('files').insertOne(newFile);

    return res.status(201).json(result.ops[0]);
  }

  static async getShow(req, res) {
    const userId = await RedisClient.get(`auth_${req.header('X-Token')}`);

    if (!userId) {
      return res.status(401).json({error: 'Unauthorized'});
    }

    const fileId  = req.params.id;

    const file = await DBClient.db.collection('files').findOne({
      _id: ObjectId(fileId),
      userId: ObjectId(userId),
    });

    if (!file) {
      return res.status(404).json({error: 'Not Found'});
    }

    return res.json(file);
  }

  static async getIndex(req, res) {
    const userId = await RedisClient.get(`auth_${req.header('X-Token')}`);

    if (!userId) {
      return res.status(401).json({error: 'Unauthorized'})
    }

    const { parentId = '0', page = 0 } = req.query;

    /* MongoDB aggregation for pagination */
    const pageSize = 20;
    const skip = page * pageSize;

    const files = await DBClient.db.collection('files')
      .find({
        userId: ObjectId(userId),
        parentId: parentId === '0' ? '0' : ObjectId(parentId),
      })
      .skip(skip)
      .limit(pageSize)
      .toArray();

    return res.json(files);
  }
}

module.exports = FilesController;
