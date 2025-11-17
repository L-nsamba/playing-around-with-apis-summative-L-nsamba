const apiKey = process.env.OPEN_FDA_API_KEY;
// const apiKey = {your_api_key};


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
        resultsDiv.innerHTML = `<p>🔍 Searching...</p>`;
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
            <h3>Generic Name</h3>
            <div class="scrollable-content"> ${simpleData.genericName}</div>
        </div>

        <div class="info-section">
            <h3>Purpose</h3>
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