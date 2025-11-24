import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import 'dotenv/config';
import { Board } from './models/Board.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased limit for large board states

// Database Connection
const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI) {
  console.error('❌ Missing MONGODB_URI in environment variables (.env)');
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- API Routes ---

// Get all boards
app.get('/api/boards', async (req, res) => {
  try {
    const boards = await Board.find().sort({ updatedAt: -1 });
    res.json(boards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new board
app.post('/api/boards', async (req, res) => {
  try {
    const newBoard = new Board(req.body);
    const savedBoard = await newBoard.save();
    res.status(201).json(savedBoard);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a board (Full sync for drag & drop simplicity)
app.put('/api/boards/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedBoard = await Board.findOneAndUpdate(
      { id: id },
      req.body,
      { new: true } // Return the updated document
    );
    if (!updatedBoard) return res.status(404).json({ message: 'Board not found' });
    res.json(updatedBoard);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a board
app.delete('/api/boards/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Board.findOneAndDelete({ id: id });
    res.json({ message: 'Board deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});