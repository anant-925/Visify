const mongoose = require('mongoose');

const snapshotSchema = new mongoose.Schema({
  step: Number,
  line: Number,
  lineExecuting: String,
  variables: mongoose.Schema.Types.Mixed,
  stackFrames: [mongoose.Schema.Types.Mixed],
  output: [String],
  description: String
}, { _id: false });

const executionTraceSchema = new mongoose.Schema({
  traceId: { type: String, required: true, unique: true, index: true },
  code: { type: String, required: true },
  language: { type: String, required: true, enum: ['python', 'c', 'cpp'] },
  snapshots: [snapshotSchema],
  totalSteps: Number,
  createdAt: { type: Date, default: Date.now, expires: 3600 }
});

module.exports = mongoose.model('ExecutionTrace', executionTraceSchema);
