const express = require('express');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

const routes = require('./routes');

app.use('/', routes);

app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});
