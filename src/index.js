require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const api = require('./api');

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

app.use('/api/v1', api);

app.get('/api/v1', (req, res) => {
  res.status(200).json({
    error: false,
    message: 'Welcome to the Analytical Lecture Systems API',
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`Backend running at http://localhost:${PORT}`),
);
