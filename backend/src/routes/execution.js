const express = require('express');
const router = express.Router();

// In-memory store for execution traces (keyed by traceId)
const traceStore = new Map();

router.get('/:id', (req, res) => {
  const { id } = req.params;
  const trace = traceStore.get(id);
  if (!trace) {
    return res.status(404).json({ error: 'Trace not found' });
  }
  res.json(trace);
});

// Allow other routes to save traces
router.saveTrace = (id, data) => {
  traceStore.set(id, data);
  // Auto-expire after 1 hour
  setTimeout(() => traceStore.delete(id), 60 * 60 * 1000);
};

module.exports = router;
