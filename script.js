// 1. Theme Switcher Logic
function changeTheme(themeName) {
    document.documentElement.setAttribute('data-theme', themeName);
}

// 2. Search Logic (Flutter Style Real-time Filtering)
function searchApps() {
    let input = document.getElementById('searchInput').value.toLowerCase();
    let appCards = document.getElementsByClassName('phone-frame');

    for (let i = 0; i < appCards.length; i++) {
        let cardText = appCards[i].innerText.toLowerCase();
        if (cardText.includes(input)) {
            appCards[i].style.display = "flex"; 
        } else {
            appCards[i].style.display = "none"; 
        }
    }
}

// 3. 🌞🌛 Dynamic Celestial Lighting (Sun & Moon Effect)
function updateCelestialLighting() {
    const hour = new Date().getHours(); // Gets the local hour of the visitor
    const shapes = document.querySelectorAll('.liquid-shape');
    
    // Calculates a curve: highest at 12 Noon (Sun peak), lowest at Midnight (Moon dim)
    // Map 24 hours to a Sine wave where 12 = 1 (max) and 0/24 = 0 (min)
    let timeScale = (hour / 24) * Math.PI; 
    let sunHeight = Math.sin(timeScale); 
    
    let opacityIntensity;
    let blurRadius;

    if (hour >= 6 && hour <= 18) {
        // DAYTIME: High brightness, wide glow (Sun effect)
        opacityIntensity = 0.5 + (sunHeight * 0.5); // Ranges from 50% to 100%
        blurRadius = 100 + (sunHeight * 50); // Glow expands up to 150px
    } else {
        // NIGHTTIME: Dim, mysterious glow (Moon effect)
        opacityIntensity = 0.15 + (sunHeight * 0.2); // Very low intensity
        blurRadius = 60 + (sunHeight * 20); // Tighter blur
    }

    // Apply the real-time logic to the background
    shapes.forEach(shape => {
        shape.style.opacity = opacityIntensity;
        shape.style.filter = `blur(${blurRadius}px)`;
        // Slightly move them up during the day and down at night
        shape.style.transform = `scale(${0.8 + (sunHeight * 0.4)})`;
    });
}

// 4. 📈 Live Visitor Counter (Global Hits)
async function fetchVisitorCount() {
    try {
        // Using a free public counter API to track hits across the globe
        let response = await fetch('https://api.counterapi.dev/v1/studio313_global/homepage/up');
        let data = await response.json();
        document.getElementById('visitor-count').innerText = data.count;
    } catch (e) {
        // Fallback if API fails
        document.getElementById('visitor-count').innerText = "1,000+";
    }
}

// Ensure functions run as soon as the website loads
window.onload = function() {
    updateCelestialLighting();
    fetchVisitorCount();
    
    // Update lighting every 10 minutes seamlessly if user keeps tab open
    setInterval(updateCelestialLighting, 600000);
};
