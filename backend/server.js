const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/account', require('./routes/account'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Zenith API is running' });
});

app.listen(PORT, () => {
  console.log(`Zenith backend running on http://localhost:${PORT}`);
});
