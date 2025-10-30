import { Router } from 'express';
import multer from 'multer';
import { StorageService } from '../services/storage.service';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const storageService = new StorageService();

router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const result = await storageService.handleUpload(req.file, req.body);
    const statusCode = result.status === 'duplicate' ? 200 : 201;
    res.status(statusCode).json(result);
  } catch (error) {
    next(error);
  }
});

export { router as uploadRouter };

