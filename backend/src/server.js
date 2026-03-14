const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const visualizeRoutes = require('./routes/visualize');
const complexityRoutes = require('./routes/complexity');
const executionRoutes = require('./routes/execution');
const algorithmsRoutes = require('./routes/algorithms');
const resourcesRoutes = require('./routes/resources');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP'
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(morgan('combined'));

app.use('/api/visualize', visualizeRoutes);
app.use('/api/complexity', complexityRoutes);
app.use('/api/execution-trace', executionRoutes);
app.use('/api/algorithm-library', algorithmsRoutes);
app.use('/api/resources', resourcesRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Visify backend running on port ${PORT}`));

module.exports = app;
