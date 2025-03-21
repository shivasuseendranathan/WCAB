const API_URL = "https://wcab.onrender.com"; // Update this if needed
let listingsData = [];
let currentPage = 1;
const listingsPerPage = 100;

async function fetchListings() {
  const listingsContainer = document.getElementById('listings');
  const emptyMessage = document.getElementById('empty-message');
  listingsContainer.innerHTML = 'Loading listings...';

  try {
    const response = await fetch(`${API_URL}`);
    const data = await response.json();
    listingsData = data.reverse(); // Latest first
    if (listingsData.length === 0) {
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
  const pageListings = listingsData.slice(start, end);

  pageListings.forEach(listing => {
    const card = document.createElement('div');
    card.className = 'listing-card';

    card.innerHTML = `
      <img src="${listing.imageUrl}" alt="${listing.title}">
      <h4>${listing.title}</h4>
      <p><strong>Price:</strong> ₹${listing.price}</p>
      <p><strong>Description:</strong> ${listing.description}</p>
      <p><strong>Contact:</strong> ${listing.contact}</p>
      <button onclick="deleteListing('${listing.id}')">Delete</button>
    `;

    listingsContainer.appendChild(card);
  });

  document.getElementById('prevBtn').disabled = (page === 1);
  document.getElementById('nextBtn').disabled = (end >= listingsData.length);
}

function previousPage() {
  if (currentPage > 1) {
    currentPage--;
    showPage(currentPage);
  }
}

function nextPage() {
  const maxPage = Math.ceil(listingsData.length / listingsPerPage);
  if (currentPage < maxPage) {
    currentPage++;
    showPage(currentPage);
  }
}

async function postListing() {
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
}

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

// Call fetchListings when the page loads
window.onload = fetchListings;
