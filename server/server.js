require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const admin = require("firebase-admin");
const multer = require("multer");
const fs = require("fs");

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;

// Firebase Admin Setup
let serviceAccount;
if (process.env.FIREBASE_CREDENTIALS) {
  serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
} else {
  throw new Error("Missing Firebase credentials.");
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "wcab-55dcc.firebasestorage.app",
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

// Multer for image uploads
const upload = multer({ storage: multer.memoryStorage() });

// POST /upload → Create a new listing
app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    const { title, price, description, contact, userEmail } = req.body;
    const imageFile = req.file;

    if (!imageFile) {
      return res.status(400).json({ error: "Image file is required" });
    }

    const imagePath = `images/${Date.now()}_${imageFile.originalname}`;
    const file = bucket.file(imagePath);

    await file.save(imageFile.buffer, {
      metadata: { contentType: imageFile.mimetype },
    });

    const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(imagePath)}?alt=media`;

    await db.collection("listings").add({
      title,
      price,
      description,
      contact,
      imageUrl,
      userEmail,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).json({ success: true, message: "Listing added." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /delete → Delete only if the user is owner
app.post('/delete', async (req, res) => {
  try {
    const { id, userEmail } = req.body;

    const docRef = db.collection("listings").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Listing not found" });
    }

    const listing = doc.data();

    if (listing.userEmail !== userEmail) {
      return res.status(403).json({ error: "Unauthorized: not your listing" });
    }

    await docRef.delete();
    res.status(200).json({ success: true, message: "Listing deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /listings
app.get('/listings', async (req, res) => {
  try {
    const snapshot = await db.collection("listings").orderBy("timestamp", "desc").get();
    const listings = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.status(200).json({ listings, page: 1, limit: 100 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
