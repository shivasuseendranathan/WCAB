// 🚀 Backend API URL
const API_URL = "https://wcab.onrender.com";


// 🟢 Function to Fetch Listings
async function fetchListings() {
    try {
        let response = await fetch(`${API_URL}/listings`);  // GET data from backend
        let listings = await response.json();  // Convert to JSON

        let listingContainer = document.getElementById("listings");  
        listingContainer.innerHTML = "";  // Clear loading text

        // 🟢 Loop through listings and display them
        listings.forEach(listing => {
            let div = document.createElement("div");
            div.className = "listing";
            div.innerHTML = `
                <img src="${listing.imageUrl}" alt="Listing Image">
                <h4>${listing.title}</h4>
                <p><strong>Price:</strong> ₹${listing.price}</p>
                <p>${listing.description}</p>
                <p><strong>Contact:</strong> ${listing.contact}</p>
            `;
            listingContainer.appendChild(div);
        });

    } catch (error) {
        console.error("❌ Error fetching listings:", error);
        document.getElementById("listings").innerHTML = "Error loading listings.";
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
