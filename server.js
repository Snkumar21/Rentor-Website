require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require("body-parser");
const path = require("path");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();

// MySQL Database Connection
const db = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "Snkumar30",
    database: process.env.DB_NAME || "rentor_db",
});

app.use(express.static(path.join(__dirname, "public")));

db.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
    } else {
        console.log('Connected to MySQL Database');
    }
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json()); // For parsing JSON bodies

// User Registration Endpoint
app.post('/registerform', (req, res) => {
    const { username, password } = req.body;

    const userExistsQuery = 'SELECT * FROM users WHERE username = ?';
    db.query(userExistsQuery, [username], (err, result) => {
        if (err) {
            console.error("Error checking user existence:", err);
            return res.status(500).json({ success: false, message: 'Error checking user' });
        }

        if (result.length > 0) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        // Hash the password before saving it
        bcrypt.hash(password, 10, (err, hash) => {
            if (err) {
                console.error("Error hashing password:", err);
                return res.status(500).json({ success: false, message: 'Error hashing password' });
            }

            const query = 'INSERT INTO users (username, password1) VALUES (?, ?)';
            db.query(query, [username, hash], (err, result) => {
                if (err) {
                    console.error("Error registering user:", err);
                    return res.status(500).json({ success: false, message: 'Error registering user' });
                }

                res.status(201).json({ success: true, message: 'User registered successfully' });
            });
        });
    });
});

// User Login Endpoint
app.post('/loginform', (req, res) => {
    const { username, password } = req.body;

    const query = 'SELECT * FROM users WHERE username = ?';
    db.query(query, [username], (err, result) => {
        if (err) return res.status(500).send({ success: false, message: 'Error logging in' });
        if (result.length === 0) return res.status(400).send({ success: false, message: 'User not found' });

        const user = result[0];

        bcrypt.compare(password, user.password1, (err, isMatch) => {
            if (err) return res.status(500).send({ success: false, message: 'Error checking password' });
            if (!isMatch) return res.status(400).send({ success: false, message: 'Invalid password' });

            const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
            res.status(200).send({ success: true, message: 'Login successful', token });
        });
    });
});

// User Contact Form
app.post("/contact", (req, res) => {
    const { name, email, message } = req.body;

    const query = "INSERT INTO contact1 (uname, email, message) VALUES (?, ?, ?)";
    db.query(query, [name, email, message], (err, results) => {
        if (err) {
            console.error("Error inserting data into contact1:", err);
            res.status(500).json({ success: false, message: 'Error submitting message' });
        } else {
            res.status(200).json({ success: true, message: 'Message submitted successfully' });
        }
    });
});

// Post a Rental Property
app.post('/postProperty', (req, res) => {
    const { propertyType, location, priceRange, description } = req.body;

    const query = 'INSERT INTO property_posts (propertyType, location, priceRange, description) VALUES (?, ?, ?, ?)';
    db.query(query, [propertyType, location, priceRange, description], (err, result) => {
        if (err) {
            console.error('Error inserting post into database:', err);
            return res.status(500).json({ success: false, message: 'Error posting property' });
        }
        res.status(201).json({ success: true, message: 'Property posted successfully' });
    });
});

// Fetch All Property Posts
app.get('/getPropertyPosts', (req, res) => {
    const query = 'SELECT * FROM property_posts ORDER BY created_at DESC';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching posts from database:', err);
            return res.status(500).json({ success: false, message: 'Error fetching posts' });
        }
        res.status(200).json(results);
    });
});

app.get('/searchProperties', (req, res) => {
    const searchQuery = req.query.q;

    if (!searchQuery || searchQuery.trim() === '') {
        return res.status(400).json({ success: false, message: 'Search query cannot be empty' });
    }

    const searchTerms = searchQuery.split(' ').map(term => `%${term.trim()}%`);

    // Debugging
    console.log("Search query:", searchQuery);
    console.log("Search terms:", searchTerms);

    const query = `
        SELECT * FROM property_posts 
        WHERE (${searchTerms.map(() => 'location LIKE ?').join(' AND ')})
        OR (${searchTerms.map(() => 'propertyType LIKE ?').join(' AND ')})
        OR (${searchTerms.map(() => 'description LIKE ?').join(' AND ')})
    `;

    const queryParams = [...searchTerms, ...searchTerms, ...searchTerms];

    db.query(query, queryParams, (err, results) => {
        if (err) {
            console.error('Error querying the database:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        // Debugging
        console.log("Database results:", results);

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'No properties found' });
        }

        res.json({ success: true, properties: results });
    });
});

// Serve static HTML files
app.get("/index", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/service", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "services.html"));
});

app.get("/register", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "register.html"));
});

// Start the server
app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});