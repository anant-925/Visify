const express = require('express');
const router = express.Router();
const { analyze } = require('../complexity/analyzer');

router.post('/', async (req, res) => {
  try {
    const { code, language } = req.body;
    if (!code || !language) {
      return res.status(400).json({ error: 'code and language are required' });
    }
    const result = analyze(code, language.toLowerCase());
    res.json({
      complexity: result.timeComplexity,
      spaceComplexity: result.spaceComplexity,
      bigO: result.bigO,
      name: result.name,
      explanation: result.explanation,
      recurrenceRelation: result.recurrenceRelation,
      steps: result.steps,
      pattern: result.pattern
    });
  } catch (err) {
    res.status(500).json({ error: 'Complexity analysis failed', message: err.message });
  }
});

module.exports = router;
