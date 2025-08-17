const express = require('express');
const path = require('path');
const adminRoutes = require('./routes/admin');

const app = express();
app.use(express.json());

app.use('/admin', adminRoutes);

// Serve frontend for demo purposes
app.use(express.static(path.join(__dirname, '../frontend')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
