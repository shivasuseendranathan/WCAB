// 🚀 Backend API URL
const API_URL = "https://wcab.onrender.com";


// 🟢 Function to Fetch Listings
let currentPage = 1;

async function fetchListings(page = 1) {
    try {
        const response = await fetch(`https://wcab.onrender.com/listings?page=${page}`);
        const data = await response.json();
        const listings = data.listings;
        const listingsContainer = document.getElementById("listings");

        listingsContainer.innerHTML = ""; // Clear previous listings

        listings.forEach((listing) => {
            const div = document.createElement("div");
            div.classList.add("listing-card");
            div.innerHTML = `
                <h3>${listing.title}</h3>
                <p>Price: ${listing.price}</p>
                <p>${listing.description}</p>
                <p>Contact: ${listing.contact}</p>
                <img src="${listing.imageUrl || 'default-placeholder.jpg'}" alt="Listing Image">
                <button class="delete-btn" data-id="${listing.id}">Delete</button>
            `;
            listingsContainer.appendChild(div);
        });

        // Update page number display
        document.getElementById("page-number").innerText = `Page ${page}`;
        currentPage = page;

        // Enable or disable pagination buttons
        document.getElementById("prev-page").disabled = page === 1;
    } catch (error) {
        console.error("Error loading listings:", error);
    }
}

// Handle Next and Previous Buttons
document.getElementById("next-page").addEventListener("click", () => {
    fetchListings(currentPage + 1);
});

document.getElementById("prev-page").addEventListener("click", () => {
    if (currentPage > 1) {
        fetchListings(currentPage - 1);
    }
});

// Load first page on startup
fetchListings();


    // Attach event listener to delete buttons
    document.querySelectorAll(".delete-btn").forEach(button => {
        button.addEventListener("click", (event) => {
            const listingId = event.target.dataset.id;
            showPasswordPrompt(listingId);
        });
    });


function showPasswordPrompt(listingId) {
    document.getElementById("password-modal").style.display = "block";

    // Confirm Delete Button Click
    document.getElementById("confirm-delete").onclick = async () => {
        const password = document.getElementById("delete-password").value;
        if (password === "42069") {
            deleteListing(listingId, password);
        } else {
            alert("Incorrect password! Try again.");
        }
    };

    // Cancel Delete Button Click
    document.getElementById("cancel-delete").onclick = () => {
        document.getElementById("password-modal").style.display = "none";
    };
}

async function deleteListing(listingId, password) {
    try {
        const response = await fetch(`https://wcab.onrender.com/delete/${listingId}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password }),
        });

        const result = await response.json();

        if (response.ok) {
            alert("Listing deleted successfully!");
            document.getElementById("password-modal").style.display = "none";
            fetchListings(); // Refresh listings
        } else {
            alert("Error: " + result.error);
        }
    } catch (error) {
        alert("Request failed: " + error.message);
    }
}

// 🚀 Call the function when the page loads
fetchListings();
document.getElementById("listingForm").addEventListener("submit", async (e) => {
    e.preventDefault();  // Stops the page from reloading

    let formData = new FormData();
    formData.append("title", document.getElementById("title").value);
    formData.append("price", document.getElementById("price").value);
    formData.append("description", document.getElementById("description").value);
    formData.append("contact", document.getElementById("contact").value);
    formData.append("image", document.getElementById("image").files[0]);

    let response = await fetch(`${API_URL}/upload`, {
        method: "POST",
        body: formData,
    });

    let result = await response.json();
    if (result.success) {
        alert("Listing added successfully!");
        fetchListings();  // Refresh listings
        document.getElementById("listingForm").reset();  // Clear form
    } else {
        alert("Error: " + result.error);
    }
});
