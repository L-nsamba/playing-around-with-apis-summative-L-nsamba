const apiKey = ""

//This function handles when the user selects browse category and ensures the search function displays multiple drugs in that category
function isSpecificDrug(searchTerm) {
    const categoryTerms = ['antibiotic', 'analgesic', 'cardiovascular', 'antidepressant', 'antihistamine', 'hypoglycemic'];
    return !categoryTerms.includes(searchTerm.toLowerCase());
}

//This function allows me to interact with the json file through the url to the Open FDA api
async function fetchDrugData(searchTerm) {
    const isCategorySearch = !isSpecificDrug(searchTerm);

    let url;
    if(isCategorySearch) {
        url = `https://api.fda.gov/drug/label.json?api_key=${apiKey}&search=(indications_and_usage:"${searchTerm}"+OR+description:"${searchTerm}")&limit=20`;
    } else {
        url = `https://api.fda.gov/drug/label.json?api_key=${apiKey}&search=openfda.brand_name:"${searchTerm}"&limit=1`
    }

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`API error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.results && data.results.length > 0) {
            if (isCategorySearch) {
                return data;
            } else {
                return data.results[0];
            }
        }

    } catch(error) {
        console.error('Failed to fetch drug data:', error);
        return { error: error.message};
    }
}

//This function is responsible for retrieving and making meaning of what the user enters in search field
async function handleSearch() {
    const drugName = document.getElementById('drugSearch').value;

    if (!drugName) {
        displayDrugInfo({error: 'Please enter a drug name'});
        return;
    }

    displayDrugInfo({loading: true});

    try {
        const result = await fetchDrugData(drugName);

        if (result.results && result.results.length > 1) {
            displayMultipleOrSingleDrugInfo(result);
        } else if (result.brandName || (result.openfda && result.openfda.brand_name)) {
            const simpleData = simplifyDrugData(result);
            displayDrugInfo(simpleData);
        } else if (result.error) {
            displayDrugInfo({error: result.error});
        } else {
            displayDrugInfo({error: 'Unexpected response from API'})
        }
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

//This function is responsible for listing the drug information under the specific categories in browse by category
function displayMultipleDrugs(drugsData) {
    const resultsDiv = document.getElementById('results');

    if (!drugsData.results || drugsData.results.length === 0) {
        resultsDiv.innerHTML = `<div class="error">No medications found in this category.</div>`;
        return;
    }

    //Only returning drugs with both valid generic & brand name
    const validDrugs = drugsData.results.filter(drug => {
        const brandName = drug.openfda?.brand_name?.[0];
        const genericName = drug.openfda?.generic_name?.[0];

        return brandName &&
               genericName &&
               brandName.toLowerCase() !== 'unknown' &&
               brandName.trim().length > 0 &&
               genericName.trim().length > 0;
    });

    if (validDrugs.length === 0) {
        resultsDiv.innerHTML = `<div class="error">No recognizable medications found in this category. Try a diiferenet search.</div>`;
        return;
    }

    let html = `
        <div class="category-results">
            <h2>💊 Medications Found</h2>
            <p class="results-count">Showing ${validDrugs.length} medications</p>
            <div class="drugs-grid">
    `

    validDrugs.forEach(drug => {
        const brandName = drug.openfda?.brand_name?.[0];
        const genericName = drug.openfda?.generic_name?.[0];
        const purpose = drug.indications_and_usage?.[0]?.substring(0, 100) + '...' || 'Purpose not specified';

        //Escaping quotes from brand name to avoid errors
        const safeBrandName = brandName.replace(/'/g, "\\'").replace(/"/g, '\\"')

        html += `
            <div class="drug-card-small" onclick="searchSpecificDrug('${safeBrandName}')">
            <h4>${brandName}</h4>
            <p><strong>Generic:</strong> ${genericName}</p>
            <p class="drug-purpose">${purpose}</p>
            <div class="click-hint">Click for details -></div>
        </div>
        `;
    });

    html += `
            </div>
        </div>
    `;

    resultsDiv.innerHTML = html;
}

//This function handles the output where user enters browse category or if they enter directly the drug they are looking for in the search bar
function displayMultipleOrSingleDrugInfo(data) {
    if (data.results && data.results.length > 1) {
        displayMultipleDrugs(data);
    } else if (data.results && data.results.length === 1) {
        const simpleData = simplifyDrugData(data.results[0]);
        displayDrugInfo(simpleData);
    } else {
        displayError(data.error || 'No results found');
    }
}

function displayError(message) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = `<div class="error">❌ ${message}</div>`
}

//Function helps to search through a specific drug inside its category
function searchSpecificDrug(drugName) {
    document.getElementById('drugSearch').value = drugName;

    window.scrollTo({
        top:0,
        behavior:'smooth'
    });

    setTimeout(() => {
        handleSearch();
    }, 300)
}

// This function allows the searching through the drug categories in browse categories
function searchCategory(category) {
    const categorySearches = {
        'Antibiotics': {
            searchTerm: 'antibiotic',
            description: 'Medications that fight bacterial infection'
        },
        'Pain Relief': {
            searchTerm: 'analgesic',
            description: 'Drugs that relieve pain'
        },
        'Heart Health': {
            searchTerm: 'cardiovascular',
            description: 'Medications for heart and blood pressure'
        },
        'Mental Health': {
            searchTerm: 'antidepressant',
            description: 'Drugs for mental health conditions'
        },
        'Allergy': {
            searchTerm: 'antihistamine',
            description: 'Medications for allergy relief'
        },
        'Diabetes': {
            searchTerm: 'hypoglycemic',
            description: 'Drugs for diabetes management'
        }
    };

    const categoryData = categorySearches[category];
    if (categoryData) {
        const resultsDiv = document.getElementById('results')
        resultsDiv.innerHTML = `<div class="loading">🔎 Searching for ${category.toLowerCase()} medications...</div>`;
        resultsDiv.scrollIntoView({behavior:'smooth'});

        document.getElementById('drugSearch').value = categoryData.searchTerm;

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
        const name = pharmacy.tags?.name || 'Unknown Pharmacy'
        const address = pharmacy.tags?.['addr:street'] || 'Address not available';

        html += `
            <div class="pharmacy-item">
                <h3>🏥 ${name}</h3>
                <p>🛣️ ${address}<p>

            </div>
        `;
    });

    html += `
            </div>
            <p class="api-credit">Data from OpenStreetMap</p>
        </div>
    `;

    resultsDiv.innerHTML = html;
}

//Drug recalls & updates function
async function showDrugRecalls() {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '<div class="loading">🔎 Searching for recent drug recalls...</div>';

    resultsDiv.scrollIntoView({behavior: 'smooth'});

    try {
        const response = await fetch('https://api.fda.gov/drug/enforcement.json?limit=10&sort=report_date:desc');

        const data = await response.json();

        if(data.results && data.results.length > 0) {
            displayRecalls(data.results);
        } else {
            resultsDiv.innerHTML = '<div class="error">No recent recalls found</div>'
        }
    } catch (error) {
        resultsDiv.innerHTML = '<div class="error">Failed to load recall information</div>'
    }
}

//This function is responsible for retrieving the drug recall information from the Open FDA API
function displayRecalls(recalls) {
    const resultsDiv = document.getElementById('results');

    let html = `
        <div class="recalls-section">
            <h2>🚨 Recent Drug Recalls & Safety Alerts</h2>
            <p class="recalls-info">Latest medication safety information from FDA</p>
            <div class="recalls-lists">
    `;

    //Accessing the recall information I need from the json and creation of the frontend User Interface that will appear
    recalls.forEach(recall => {
        const product = recall.product_description || 'Product description not available';
        const reason = recall.reason_for_recall || 'Reason not specified';
        const company = recall.recalling_firm || 'Company not specified';


        html += `
            <div class="recall-item ${recall.recall_initiation_date ? 'recent' : ''}">
                <h3>${product}</h3>
                <div class="recall-meta">
                    <span class="recall-company">🏢 ${company}</span>
                </div>
                <div class="recall-reason">
                    <strong>Reason:</strong> ${reason}
                </div>
            </div>
        `;
    });

    html += `
            </div>
            <p class="api-credit">Data from FDA Enforcement Reports • Updated regularly </p>
        </div>
    `;

    resultsDiv.innerHTML = html;
}