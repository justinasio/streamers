require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const compression = require('compression');
const helmet = require('helmet');

// App
const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(compression());
app.use(helmet({ contentSecurityPolicy: false }));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

// When connected to a database -- start the application
mongoose.connect(process.env.MONGODB_URI, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
});
mongoose.connection.on('open', async () => {
    console.log('Connected to Mongoose');

    app.listen(process.env.PORT || 3000);
});
mongoose.connection.on('error', (err) => console.log(err));
