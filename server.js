const mongoose = require('mongoose');
const app = require('./app');

const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });

mongoose
  .connect(process.env.DATABASE_LOCAL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('DB connection has been done!!'));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Here I am listening you at port:${port}. Date: ${new Date().toLocaleString()}`);
});
