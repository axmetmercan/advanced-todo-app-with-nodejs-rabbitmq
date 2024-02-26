const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });

const mongoose = require('mongoose');
const app = require('./app');

mongoose
  .connect(String(process.env.DB), {})
  .then(() => {
    console.log(
      `Database Connectionh has been succeeded ${process.env.DBNAME}.`,
    );
  })
  .catch((e) => {
    console.log(e);
  });

const port = process.env.PORT || 8000;

app.listen(port, () => {
  console.log(`App Running on port ${port}`);
});
