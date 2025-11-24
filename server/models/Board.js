import mongoose from 'mongoose';

const SubtaskSchema = new mongoose.Schema({
  id: String,
  content: String,
  completed: Boolean
}, { _id: false });

const TaskSchema = new mongoose.Schema({
  id: String,
  content: String,
  description: String,
  labels: [String],
  subtasks: [SubtaskSchema]
}, { _id: false });

const ColumnSchema = new mongoose.Schema({
  id: String,
  title: String,
  taskIds: [String]
}, { _id: false });

const BoardSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: String,
  // We use Map to store dynamic keys (e.g. "col-1": {...}) which matches the frontend structure
  columns: {
    type: Map,
    of: ColumnSchema
  },
  tasks: {
    type: Map,
    of: TaskSchema
  },
  columnOrder: [String]
}, { timestamps: true });

export const Board = mongoose.model('Board', BoardSchema);