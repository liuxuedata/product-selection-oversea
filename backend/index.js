const express = require('express');
const bodyParser = require('body-parser');
const authRouter = require('./auth');

const app = express();
app.use(bodyParser.json());

app.use('/auth', authRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
