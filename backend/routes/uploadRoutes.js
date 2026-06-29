import express from 'express';
import upload from '../middleware/uploadMiddleware.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Route to handle single image upload (e.g., logo or banner)
router.post('/single', protect, authorize('Super Admin', 'Mall Admin'), (req, res) => {
  const uploadSingle = upload.single('image');

  uploadSingle(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Missing image file. Please choose an image to upload.' });
    }

    const host = req.get('host');
    const protocol = req.protocol;
    const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

    res.status(200).json({ 
      message: 'Image uploaded successfully!', 
      url: fileUrl,
      filename: req.file.filename
    });
  });
});

// Route to handle multiple image uploads (e.g., gallery images)
router.post('/multiple', protect, authorize('Super Admin', 'Mall Admin'), (req, res) => {
  const uploadMultiple = upload.array('images', 8); // Max 8 gallery images

  uploadMultiple(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No image files uploaded' });
    }

    const host = req.get('host');
    const protocol = req.protocol;
    
    const fileUrls = req.files.map(file => `${protocol}://${host}/uploads/${file.filename}`);

    res.status(200).json({ 
      message: 'Gallery images uploaded successfully!', 
      urls: fileUrls 
    });
  });
});

export default router;
