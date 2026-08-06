
// Theme Switcher Logic
function changeTheme(themeName) {
    document.documentElement.setAttribute('data-theme', themeName);
}
// Theme Switcher Logic (Pehle wala code)
function changeTheme(themeName) {
    document.documentElement.setAttribute('data-theme', themeName);
}

// 🚀 Search Logic (Flutter ke onChanged aur filter jaisa)
function searchApps() {
    // 1. Jo text user ne type kiya hai use pakro aur small letters mein convert karo
    let input = document.getElementById('searchInput').value.toLowerCase();
    
    // 2. Saare mobile frames (app cards) ko get karo
    let appCards = document.getElementsByClassName('phone-frame');

    // 3. Har card par loop chala kar check karo
    for (let i = 0; i < appCards.length; i++) {
        // Card ke andar ka saara text read karo (Title, status, description)
        let cardText = appCards[i].innerText.toLowerCase();

        // 4. Agar type kiya gaya word card ke text mein maujood hai, toh usko show karo
        if (cardText.includes(input)) {
            appCards[i].style.display = "flex"; // Show (Flutter ka UI rebuild)
        } else {
            // Agar word match nahi kiya, toh us card ko hide kar do
            appCards[i].style.display = "none"; // Hide
        }
    }
}
