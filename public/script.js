import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyCwS99NMY-d-nfR9z30Bgg1owaFOZM7MiE",
  authDomain: "wcab-55dcc.firebaseapp.com",
  projectId: "wcab-55dcc",
  storageBucket: "wcab-55dcc.firebasestorage.app",
  messagingSenderId: "492891848804",
  appId: "1:492891848804:web:fc2053ffa1ac52e7f4df71",
  measurementId: "G-NXB3NKTDFX"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const API_URL = 'https://wcab.onrender.com';
let listingsData = [];
let filteredListings = [];
let currentPage = 1;
const listingsPerPage = 100;
let currentUserEmail = null;

// Sign In
window.signIn = async function () {
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    alert("Login failed: " + error.message);
  }
};

// Sign Out
window.signOut = async function () {
  try {
    await signOut(auth);
  } catch (error) {
    alert("Logout failed: " + error.message);
  }
};

// Auth State Watcher
onAuthStateChanged(auth, user => {
  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const userName = document.getElementById('user-name');
  const form = document.getElementById('listing-form');

  if (user) {
    currentUserEmail = user.email;
    loginBtn.style.display = 'none';
    logoutBtn.style.display = 'inline-block';
    userName.style.display = 'inline-block';
    userName.textContent = `Hello, ${user.displayName}`;
    form.style.display = 'block';
  } else {
    currentUserEmail = null;
    loginBtn.style.display = 'inline-block';
    logoutBtn.style.display = 'none';
    userName.style.display = 'none';
    form.style.display = 'none';
  }

  fetchListings();
});

async function fetchListings() {
  const listingsContainer = document.getElementById('listings');
  const emptyMessage = document.getElementById('empty-message');
  listingsContainer.innerHTML = 'Loading listings...';

  try {
    const response = await fetch(`${API_URL}/listings`);
    const data = await response.json();
    listingsData = data.listings.reverse();
    filteredListings = [...listingsData]; // Start with all listings

    if (filteredListings.length === 0) {
      emptyMessage.style.display = 'block';
    } else {
      emptyMessage.style.display = 'none';
    }

    showPage(currentPage);
  } catch (error) {
    listingsContainer.innerHTML = '<p style="text-align:center; color:red;">Error loading listings.</p>';
  }
}

function showPage(page) {
  const listingsContainer = document.getElementById('listings');
  listingsContainer.innerHTML = '';
  const start = (page - 1) * listingsPerPage;
  const end = start + listingsPerPage;
  const pageListings = filteredListings.slice(start, end);

  pageListings.forEach(listing => {
    const card = document.createElement('div');
    card.className = 'listing-card';

    const canDelete = currentUserEmail && listing.userEmail === currentUserEmail;

    card.innerHTML = `
      <img src="${listing.imageUrl}" alt="${listing.title}">
      <h4>${listing.title}</h4>
      <p><strong>Price:</strong> ₹${listing.price}</p>
      <p><strong>Description:</strong> ${listing.description}</p>
      <p><strong>Contact:</strong> ${listing.contact}</p>
      ${canDelete ? `<button onclick="deleteListing('${listing.id}')">Delete</button>` : ''}
    `;

    listingsContainer.appendChild(card);
  });

  document.getElementById('prevBtn').disabled = (page === 1);
  document.getElementById('nextBtn').disabled = (end >= filteredListings.length);
}

window.previousPage = function () {
  if (currentPage > 1) {
    currentPage--;
    showPage(currentPage);
  }
};

window.nextPage = function () {
  const maxPage = Math.ceil(listingsData.length / listingsPerPage);
  if (currentPage < maxPage) {
    currentPage++;
    showPage(currentPage);
  }
};

window.postListing = async function () {
  const title = document.getElementById("title").value.trim();
  const price = document.getElementById("price").value.trim();
  const description = document.getElementById("description").value.trim();
  const contact = document.getElementById("contact").value.trim();
  const imageInput = document.getElementById("image");
  const imageFile = imageInput.files[0];

  if (!title || !price || !description || !contact || !imageFile) {
    alert("Please fill in all fields and select an image.");
    return;
  }

  const formData = new FormData();
  formData.append("title", title);
  formData.append("price", price);
  formData.append("description", description);
  formData.append("contact", contact);
  formData.append("image", imageFile);
  formData.append("userEmail", currentUserEmail || "");

  try {
    const response = await fetch(`${API_URL}/upload`, {
      method: "POST",
      body: formData
    });

    const result = await response.json();
    if (response.ok) {
      showToast("🎉 Listing added successfully!");
      document.getElementById("listing-form").reset();
      fetchListings();
    } else {
      alert("Error: " + result.error);
    }
  } catch (error) {
    alert("Upload failed: " + error.message);
  }
};

window.handleSearch = function () {
  const query = document.getElementById('search-input').value.toLowerCase();

  filteredListings = listingsData.filter(listing =>
    listing.title.toLowerCase().includes(query) ||
    listing.description.toLowerCase().includes(query) ||
    listing.contact.toLowerCase().includes(query)
  );

  currentPage = 1;
  showPage(currentPage);
};

window.deleteListing = async function (id) {
  try {
    const response = await fetch(`${API_URL}/delete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ id, userEmail: currentUserEmail })
    });

    const result = await response.json();
    if (response.ok) {
      showToast("✅ Listing deleted");
      fetchListings();
    } else {
      alert("Error: " + result.error);
    }
  } catch (error) {
    alert("Deletion failed: " + error.message);
  }
};

function showToast(message) {
  const toast = document.createElement("div");
  toast.textContent = message;
  toast.style.position = "fixed";
  toast.style.bottom = "20px";
  toast.style.left = "50%";
  toast.style.transform = "translateX(-50%)";
  toast.style.background = "#a90000";
  toast.style.color = "#fff";
  toast.style.padding = "12px 20px";
  toast.style.borderRadius = "6px";
  toast.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
  toast.style.fontSize = "14px";
  toast.style.zIndex = "1000";
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}
