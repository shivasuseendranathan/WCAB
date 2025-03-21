const express = require('express');
const admin = require('firebase-admin');
const multer = require('multer');
const fs = require('fs');
const cors = require('cors');
const serviceAccount = require('./serviceAccountKey.json'); // Make sure this file exists

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "wcab-55dcc.appspot.com", // ✅ Use the correct bucket name
});

const db = admin.firestore();
const bucket = admin.storage().bucket();
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer setup for image upload
const upload = multer({ dest: 'uploads/' });

app.get('/', (req, res) => {
  res.send('WCAB Backend is Running');
});

// ✅ UPLOAD a new listing with userEmail
app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    const { title, price, description, contact, userEmail } = req.body;
    const imageFile = req.file;

    if (!imageFile) {
      return res.status(400).json({ error: "Image file is required" });
    }

    const imagePath = `images/${Date.now()}_${imageFile.originalname}`;
    await bucket.upload(imageFile.path, { destination: imagePath });

    const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(imagePath)}?alt=media`;

    fs.unlinkSync(imageFile.path); // Delete local file

    await db.collection('listings').add({
      title,
      price,
      description,
      contact,
      userEmail, // ✅ Now stored
      imageUrl,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).json({ success: true, message: "Listing uploaded" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ GET listings
app.get('/listings', async (req, res) => {
  try {
    const snapshot = await db.collection('listings').orderBy('timestamp', 'desc').get();
    const listings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json({ listings, page: 1, limit: 100 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ DELETE a listing (only by owner)
app.post('/delete', async (req, res) => {
  try {
    const { id, userEmail } = req.body;

    const listingRef = db.collection('listings').doc(id);
    const doc = await listingRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Listing not found" });
    }

    const listing = doc.data();

    if (listing.userEmail !== userEmail) {
      return res.status(403).json({ error: "Unauthorized: You can only delete your own listing." });
    }

    await listingRef.delete();
    res.status(200).json({ success: true, message: "Listing deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
