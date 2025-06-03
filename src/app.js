const express = require('express');
const bodyParser = require('body-parser');
const setupDatabase = require('./config/database'); 
const accountRoutes = require('./routes/account.routes.js');
const destinationRoutes = require('./routes/destination.routes');
const dataHandlerRoutes = require('./routes/dataHandler.routes');

const app = express();
const PORT = process.env.PORT || 3000;


app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true })); 

const db = setupDatabase();


app.use((req, res, next) => {
    req.db = db; 
    next();
});

// API Routes
app.use('/accounts', accountRoutes);
app.use('/accounts', destinationRoutes); 
app.use('/server', dataHandlerRoutes);

app.get('/', (req, res) => {
    res.send('Data Pusher API is running!');
});

const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Database file: data_pusher.db`);
});

process.on('SIGINT', () => {
    console.log('Closing database connection...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        }
        console.log('Database connection closed.');
        process.exit(0);
    });
});

module.exports = app; 
