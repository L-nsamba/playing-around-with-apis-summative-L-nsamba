// const apiKey = process.env.OPEN_FDA_API_KEY;
const apiKey = ""


//This function allows me to interact with the json file through the url to the Open FDA api
async function fetchDrugData(drugName) {
    const url = `https://api.fda.gov/drug/label.json?api_key=${apiKey}&search=openfda.brand_name:"${drugName}"&limit=1`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`API error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.results && data.results.length > 0) {
            return data.results[0];
        } else {
            throw new Error('No drug found with that name.');
        }
    } catch(error) {
        console.error('Failed to fetch drug data:', error);
        return { error: error.message};
    }
}

//This function is responsible for retrieving and making meaning of what the user enters in search field
async function handleSearch() {
    const drugName = document.getElementById(`drugSearch`).value;

    if (!drugName) {
        displayDrugInfo({error: 'Please enter a drug name'});
        return;
    }

    displayDrugInfo({loading: true});

    try {
        const rawData = await fetchDrugData(drugName);
        const simpleData = simplifyDrugData(rawData);
        displayDrugInfo(simpleData);
    } catch (error) {
        displayDrugInfo({error: 'Failed to fetch drug information'})
    }
}
//This function allows me to filter and extract only the information I want from the json
function simplifyDrugData(rawData) {
    return {
        brandName: rawData.openfda?.brand_name?.[0] || `Information not available`,
        genericName: rawData.openfda?.generic_name?.[0] || `Information not available`,
        purpose: rawData.purpose?.[0] || rawData.indications_and_usage?.[0] || `Information not available`,
        warnings: rawData.warnings?.[0] || rawData.boxed_warning?.[0] || `None listed`,
        sideEffects: rawData.adverse_reactions?.[0] || `Information not available`,
        dosage: rawData.dosage_and_administration?.[0] || `Consult your doctor`
    };
}

//This function allows the relevant information I have selected from the json to be displayed on the html page
function displayDrugInfo(simpleData) {
    const resultsDiv = document.getElementById(`results`);

    if (simpleData.loading) {
        resultsDiv.innerHTML = `<p>🔎 Searching for drug information...</p>`;
        return;
    }

    if(simpleData.error) {
        resultsDiv.innerHTML = `<p class="error">❌ ${simpleData.error}</p>`;

        return;
    }

    resultsDiv.innerHTML = `
    <div class="drug-card">
        <h2>💊 ${simpleData.brandName}</h2>

        <div class="info-section">
            <h3> 📌 Generic Name</h3>
            <div class="scrollable-content"> ${simpleData.genericName}</div>
        </div>

        <div class="info-section">
            <h3>🎯Purpose</h3>
            <div class="scrollable-content"> ${simpleData.purpose}</div>
        </div>

        <div class="info-section">
            <h3>⚠️ Warnings</h3>
            <div class="scrollable-content"> ${simpleData.warnings}</div>
        </div>

        <div class="info-section">
            <h3>🚨 Side Effects</h3>
            <div class="scrollable-content">${simpleData.sideEffects}</div>
        </div>

        <div class="info-section">
            <h3>💊 Dosage Information</h3>
            <div class="scrollable-content">${simpleData.dosage}</div>
        </div>

    </div>
    `
}

// This function allows the searching through the drug categories in browse categories

function searchCategory(category) {

    const categoryDrugs = {
        'Antibiotics': ['Amoxicillin', 'Azithromycin', 'Doxycycline'],
        'Pain Relief': ['Ibuprofen', 'Acetaminophen ', 'Naproxen'],
        'Heart Health': ['Lisinopril', 'Atorvastatin', 'Metoprolol'],
        'Mental Health': ['Sertraline', 'Fluoxetine', 'Escitalopram'],
        'Allergy': ['Cetirizine', 'Loratadine', 'Fexofenadine'],
        'Diabetes': ['Metformin', 'Insulin', 'Glipizide']
    };

    const drugs = categoryDrugs[category];

    if(drugs) {
        //Randomizes through the category and displays info of a random drug in that category
        const randomDrug = drugs[Math.floor(Math.random() * drugs.length)];

        const resultsDiv = document.getElementById('results');
        resultsDiv.innerHTML = `<div class="loading">🔎 Showing random ${category.toLowerCase()}
        medication: <strong>${randomDrug}</strong>
        </div>`;

        //Triggering the inputting of the random drug selected into the search bar
        document.getElementById('drugSearch').value = randomDrug;

        resultsDiv.scrollIntoView({behavior: 'smooth'});

        setTimeout(() => {
            handleSearch();
        }, 3000);
    }
}

//Pharmacy finder logic
async function findPharmacies(){
    const resultsDiv = document.getElementById('results');

    resultsDiv.innerHTML = `<div class="loading"> 📍 Finding your location...</div>`;
    resultsDiv.scrollIntoView({behavior:'smooth'});

    try {
        const position = await getCurrentPositionWithTimeout();
        await searchWithCoordinates(position.coords.latitude, position.coords.longitude);
    } catch (error) {
        showManualLocationInput();
    }
}

//This function is responsible for accessing the current position of the user
function getCurrentPositionWithTimeout (timeout = 10000) {
    return new Promise ((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported'));
            return;
        }

        navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: timeout,
            enableHighAccuracy: false
        });
    })
}

//This function searches for pharmacies in proximity basing on the geographical coordinates
async function searchWithCoordinates(lat, lng) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = `<div class="loading">📍 Searching for nearby pharmacies...</div>`;

    try {
        //This will query for pharmacies within 5km relative to the users location
        const query = `
            [out:json];
            node[amenity=pharmacy](around:5000, ${lat}, ${lng});
            out body;
        `;

        const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'data=' +encodeURIComponent(query)
        });

        const data = await response.json();

        if (data.elements && data.elements.length > 0) {
            displayPharmacies(data.elements, lat, lng);
        } else {
            showManualLocationInput('❌ No pharmacies found nearby. Try a different location.');
        }
    } catch (error) {
        showManualLocationInput('❌ Search failed. Please enter your location manually')
    }
}

//This function prompts the user to manually enter their location incase of failure to access current live location
function showManualLocationInput(message = 'Enter your location to find pharmacies:') {
    const resultsDiv = document.getElementById('results');

    resultsDiv.innerHTML = `
        <div class="manual-location">
            <h3>📍 Find Pharmacies</h3>
            <p>${message}</p>
            <div class="location-search">
                <input type="text" id="locationInput" placeholder="Enter city or address">
                <button onclick="searchWithManualLocation()">Search Pharmacies</button>
            </div>
            <p class="small-text">Or <a href='#' onclick="findPharmacies()">Try automatic location again</a></p>
        </div>
    `;
}

//This function contains the logic to actually search the API when user manually enters their location
async function searchWithManualLocation() {
    const address = document.getElementById('locationInput').value;

    if (!address.trim()) {
        alert('Please enter a location');
        return;
    }

    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
        const data = await response.json();

        if (data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            await searchWithCoordinates(lat, lon);
        } else {
            alert ('Location not found. Try a different address.')
        }
    } catch (error) {
        alert('Geocoding failed. Please try again');
    }
}

//This function shows the pharamcies found near the user basing on the coordinates of their current location & OpenStreetMap API
function displayPharmacies(pharmacies, userLat, userLng) {
    const resultsDiv = document.getElementById('results');

    let html = `
        <div class="pharmacy-results">
            <h2>📍 Nearby Pharmacies</h2>
            <p class="location-info">Found ${pharmacies.length} pharmacies nearby</p>
            <div class="pharmacy-list">
    `;

    pharmacies.slice(0,8).forEach(pharmacy => {
        const distance = calculateDistance(
            userLat, userLng,
            pharmacy.lat, pharmacy.lon
        );

        const name = pharmacy.tags?.name || 'Unknown Pharmacy'
        const address = pharmacy.tags?.['addr:street'] || 'Address not available';

        html += `
            <div class="pharmacy-item">
                <h3>🏥 ${name}</h3>
                <p>📍 ${address}</p>
                <p>🛣️ ${distance.toFixed(1)} km away</p>
            </div>
        `;
    });

    html += `
            </div>
            <p class="api-credit">Data from OpenStreetMap • Distances are approximate</p>
        </div>
    `;

    resultsDiv.innerHTML = html;
}

//This function contains the core logic for the distance calculations and making sense of the users coordintes to find nearby pharmacies
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c
}