// src/routes/tasks.js
const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// All routes protected
router.use(authMiddleware);

// CRUD
router.post('/', taskController.createTask);
router.get('/', taskController.listTasks);
router.get('/:id', taskController.getTask);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

// Export
router.get('/export/excel', taskController.exportTasks);

// Upload bulk tasks (multipart form field name: file)
router.post('/upload', upload.single('file'), taskController.uploadTasks);

module.exports = router;
