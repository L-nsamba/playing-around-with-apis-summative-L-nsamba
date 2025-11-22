## MEDITRACK - DRUG INFORMATION & PHARMACY FINDER SYSTEM 💊🩺

### 📖 Overview
A full-stack web application that enables users to search for medications, explore drug categories, locate nearby pharmacies, and access real-time FDA drug recall alerts. The system is built with a scalable architecture featuring load balancing, SSL encryption, and integration with two external APIs.

### 🔗 Live Demo
<li> Live Application URL: https://www.leonnsamba.tech || https://leonnsamba.tech </li>
<li> Video Demo : Coming soon... 🚧</li>

### 🎯 Features
#### Drug Search & Information 🔬
<li>Search for medication by name and you will be presented with a detailed pharmaceutical review of the generic name, purpose, warnings, side effects, and dosage information powered by the OpenFDA API. </li>

#### Pharmacy Finder 🏥
<li>Find nearby pharmacies with location-based search functionality powered by the OpenStreetMap API.</li>

#### Category Browse 🔎
<li>Explore drugs organized into six distinct categories by drug classifications for easy discovery. The categories include: antibiotics, pain relief, heart health, mental health, allergy, and diabetes.</li>

#### Drug Recall Alerts ⚠️
<li>Access real-time FDA drug recall information to stay informed about medication safety updates.</li>

#### Responsive Design 📱
<li>Optimized user interface that works seamlessly across desktop and mobile devices</li>

### 🏗️ Tech Stack
1. Frontend: HTML, CSS, JavaScript
2. Deployment: Nginx, Ubuntu 18.04 LTS
3. APIs: OpenFDA API, OpenStreetMap (OSM) API

### 🛠️ Setup & Installation
i. Clone the project repository locally in your desired terminal and serve the ``` index.html ``` file with your local server deployer of choice (e.g Live Server for VS Code)
```sh
    git clone https://github.com/L-nsamba/playing-around-with-apis-summative-L-nsamba.git
    cd index.html
```

ii. Configure environment variables (create an .env file to store your API KEY)
```sh
    OPEN_FDA_API_KEY = {your-open-fda-key}
```
NB: For the faciliators/graders, the key I used will be accessible via the comment section on Canvas.

### 🌐 Deployment Architecture
