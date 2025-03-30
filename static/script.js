let map;
let marker;

document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM fully loaded");  // Debugging
    const queryList = document.getElementById("query-list");

    if (!queryList) {
        console.error("Error: query-list element not found!");
        return;
    }

    initMap();
    loadQueries();
    setInterval(loadQueries, 5000);  
});


async function loadQueries() {
    try {
        const response = await fetch("/all_queries");
        const queries = await response.json();

        const queryList = document.getElementById("query-list");
        queryList.innerHTML = "";

        queries.forEach((query, index) => {
            const queryCard = document.createElement("div");
            queryCard.classList.add("query-card");
            queryCard.innerText = `Query ${index + 1}\n${query.address}`;
            queryCard.onclick = () => showDetails(query);
            queryList.appendChild(queryCard);
        });
    } catch (error) {
        console.error("Error loading queries:", error);
    }
}

function showDetails(query) {
    const imageElement = document.getElementById("uploaded-image");
    const detailsSection = document.getElementById("details-section");
    const mapContainer = document.getElementById("map");

    // Update image
    imageElement.src = query.image_url.startsWith("/") ? query.image_url : "/uploads/" + query.image_url;

    imageElement.style.display = "block";

    // Show details section
    detailsSection.classList.remove("hidden");
    mapContainer.style.display = "block";

    // Update map location
    updateMap(parseFloat(query.latitude), parseFloat(query.longitude));
}

function initMap() {
    
    
    map = L.map("map").setView([20.5937, 78.9629], 5);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors"
    }).addTo(map);
}

function updateMap(lat, lng) {
    if (!map) {
        initMap();
    }

    if (marker) {
        marker.setLatLng([lat, lng]);
    } else {
        marker = L.marker([lat, lng]).addTo(map);
    }

    // Force Leaflet to recalculate map size
    setTimeout(() => {
        map.invalidateSize();
        map.setView([lat, lng], 12);
    }, 100);  
}

 