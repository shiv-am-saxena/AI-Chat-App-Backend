import dotenv from 'dotenv';
dotenv.config();//.env file configuration
import http from 'http';
import app from './app.js'; //server configuration
import connectDb from './db/mongooseConnection.js';
import errorHandler from './middlewares/errorHandler.js';

const server = http.createServer(app); //server creation
const port = process.env.PORT || 8080;
// database connection
connectDb()
    .then(() => {
        server.listen(port, () => {
            console.log(`Server is running at port ${port}`);
        });
    })
    .catch((err) => {
        console.log(`Connection to the database failed due to ${err}`);
    });

app.use(errorHandler);