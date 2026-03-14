const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const pythonSimulator = require('../simulator/pythonSimulator');
const cSimulator = require('../simulator/cSimulator');

router.post('/', async (req, res) => {
  try {
    const { code, language } = req.body;
    if (!code || !language) {
      return res.status(400).json({ error: 'code and language are required' });
    }
    const lang = language.toLowerCase();
    let result;
    if (lang === 'python') {
      result = pythonSimulator.simulate(code);
    } else if (lang === 'c' || lang === 'cpp' || lang === 'c++') {
      result = cSimulator.simulate(code);
    } else {
      return res.status(400).json({ error: `Unsupported language: ${language}` });
    }

    if (result.error) {
      return res.status(422).json({ error: result.error });
    }

    const traceId = uuidv4();
    const lastSnapshot = result.snapshots[result.snapshots.length - 1] || {};

    res.json({
      traceId,
      language: lang,
      totalSteps: result.snapshots.length,
      snapshots: result.snapshots,
      variables: lastSnapshot.variables || {},
      stackFrames: lastSnapshot.stackFrames || [],
      output: result.output
    });
  } catch (err) {
    res.status(500).json({ error: 'Visualization failed', message: err.message });
  }
});

module.exports = router;
