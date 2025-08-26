const express = require('express');
const cors = require('cors');
const { sequelize, testConnection } = require('./config/db');
const userModel = require('./models/user'); // ensure model is loaded
const authRoutes = require('./routes/auth');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// routes
app.use('/api/auth', authRoutes);

// basic root
app.get('/', (req, res) => res.json({ message: 'Task Manager API (Auth module) is running' }));

const start = async () => {
  try {
    await testConnection();

    // Sync models - in production, prefer migrations
    await sequelize.sync({ alter: true });
    console.log('✅ All models were synchronized successfully.');

    app.listen(PORT, () => {
      console.log(`🚀 Server started on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start app:', err);
    process.exit(1);
  }
};

start();
