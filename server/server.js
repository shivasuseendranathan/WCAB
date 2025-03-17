require('dotenv').config(); // Load environment variables
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;

// Initialize Firebase
const serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});
const db = admin.firestore();
const bucket = admin.storage().bucket();

// Middleware
app.use(cors());
app.use(express.json());

// Multer for Image Uploads
const upload = multer({ dest: 'uploads/' });

app.post('/upload', upload.single('image'), async (req, res) => {
    try {
        const { title, price, description, contact } = req.body;
        const imageFile = req.file;

        if (!imageFile) {
            return res.status(400).json({ error: "Image file is required" });
        }

        // Upload image to Firebase Storage
        const imagePath = `images/${Date.now()}_${imageFile.originalname}`;
        await bucket.upload(imageFile.path, { destination: imagePath });

        // Generate a public image URL
        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(imagePath)}?alt=media`;

        // Remove local file after upload
        fs.unlinkSync(imageFile.path);

        // Save listing to Firestore
        await db.collection('listings').add({
            title,
            price,
            description,
            contact,
            imageUrl,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

        res.status(200).json({ success: true, message: "Listing added successfully!" });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// 🟢 Route: Get All Listings
app.get('/listings', async (req, res) => {
    try {
        const snapshot = await db.collection('listings').orderBy('timestamp', 'desc').get();
        let listings = [];
        snapshot.forEach(doc => listings.push({ id: doc.id, ...doc.data() }));
        res.status(200).json(listings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
