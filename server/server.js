require('dotenv').config(); // Load environment variables
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
const PORT = process.env.PORT || 8080;

// Load Firebase credentials from Render environment variable
const admin = require("firebase-admin");

let serviceAccount;
if (process.env.FIREBASE_CREDENTIALS) {
    serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
} else {
    throw new Error("Missing Firebase credentials. Set FIREBASE_CREDENTIALS in environment variables.");
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "wcab-55dcc.firebasestorage.app",
});

const db = admin.firestore();
const bucket = admin.storage().bucket();


// Middleware
app.use(cors());
app.use(express.json());

const multer = require("multer");
const fs = require("fs");

// Configure Multer (for handling file uploads)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/upload', upload.single('image'), async (req, res) => {
    try {
        const { title, price, description, contact } = req.body;
        const imageFile = req.file;

        if (!imageFile) {
            return res.status(400).json({ error: "Image file is required" });
        }

        // Upload image to Firebase Storage
        const imagePath = `images/${Date.now()}_${imageFile.originalname}`;
        const file = bucket.file(imagePath);

        await file.save(imageFile.buffer, {
            metadata: { contentType: imageFile.mimetype },
        });

        // Generate a public image URL
        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(imagePath)}?alt=media`;

        // Save listing to Firestore
        await db.collection("listings").add({
            title,
            price,
            description,
            contact,
            imageUrl, // ✅ Correctly storing image URL
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

        res.status(200).json({ success: true, message: "Listing added successfully!", imageUrl });

    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ error: error.message });
    }
});


// 🟢 Route: Get All Listings
app.get('/listings', async (req, res) => {
    try {
        let page = parseInt(req.query.page) || 1;  // Default to page 1
        let limit = 100;  // Show 100 listings per page
        let startAt = (page - 1) * limit;

        const snapshot = await db.collection("listings")
            .orderBy("timestamp", "desc")
            .offset(startAt)
            .limit(limit)
            .get();

        let listings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json({ listings, page, limit });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/delete', async (req, res) => {
    try {
      const { id, password } = req.body;
  
      // Simple password check
      if (password !== '42069') {
        return res.status(401).json({ error: 'Unauthorized. Incorrect password.' });
      }
  
      // Delete from Firestore
      await db.collection('listings').doc(id).delete();
  
      res.status(200).json({ success: true, message: 'Listing deleted.' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  


// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
