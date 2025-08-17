const express = require('express');
const router = express.Router();

// Simple auth middleware
router.use((req, res, next) => {
  const auth = req.headers.authorization;
  if (auth !== 'Bearer admin123') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

// Product review routes
router.get('/products/pending', (req, res) => {
  res.json([{ id: 1, name: 'Product A', status: 'pending' }]);
});

router.post('/products/:id/approve', (req, res) => {
  const id = req.params.id;
  res.json({ id, status: 'approved' });
});

// User management
router.get('/users', (req, res) => {
  res.json([{ id: 1, name: 'User1' }]);
});

// Statistics report
router.get('/stats', (req, res) => {
  res.json({
    newProducts: 5,
    visits: 120,
    conversionRate: '2%'
  });
});

module.exports = router;
