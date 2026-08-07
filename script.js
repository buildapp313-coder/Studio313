// ==========================================
// STUDIO313 - VIP MASTER SCRIPT
// ==========================================

// --- 1. THEME MANAGEMENT (Dark, Light, VIP) ---
function changeTheme(themeValue) {
    // HTML tag par data-theme attribute set karega
    document.documentElement.setAttribute('data-theme', themeValue);
    
    // User ki pasand ko browser (Local Storage) mein save karega taake page refresh hone par theme gayab na ho
    localStorage.setItem('studio313_theme', themeValue);
}

// --- 2. CUSTOM DROPDOWN LOGIC ---
function toggleDropdown() {
    document.getElementById("themeDropdown").classList.toggle("show");
}

// Jab user dropdown se koi theme select karega
function setCustomTheme(themeValue, themeText) {
    changeTheme(themeValue); // Theme change karega
    document.getElementById("dropdownBtnText").innerText = themeText; // Button ka text update karega
    document.getElementById("themeDropdown").classList.remove("show"); // Dropdown band karega
}

// Agar user screen par kahin aur click kare, toh dropdown khud band ho jaye
window.onclick = function(event) {
    if (!event.target.matches('.dropdown-btn') && !event.target.matches('#dropdownBtnText')) {
        let dropdowns = document.getElementsByClassName("dropdown-content");
        for (let i = 0; i < dropdowns.length; i++) {
            if (dropdowns[i].classList.contains('show')) {
                dropdowns[i].classList.remove('show');
            }
        }
    }
}

// --- 3. MOBILE HAMBURGER MENU ---
function toggleMobileMenu() {
    let nav = document.getElementById("navLinks");
    if(nav) {
        nav.classList.toggle("active");
    }
}

// --- 4. PAGE LOAD INITIALIZATION ---
// Jab page load ho toh purani setting aur live counter set kare
window.onload = function() {
    // Check karega ke user ne pehle kaunsi theme save ki thi
    let savedTheme = localStorage.getItem('studio313_theme') || 'dark';
    changeTheme(savedTheme);
    
    // Dropdown ka text saved theme ke mutabiq theek karega (Premium & Clean text without emojis)
    let themeText = 'Dark Liquid';
    if(savedTheme === 'light') themeText = 'Light Glass';
    if(savedTheme === 'vip') themeText = 'VIP Gold';
    
    let dropdownTextEl = document.getElementById("dropdownBtnText");
    if(dropdownTextEl) {
        dropdownTextEl.innerText = themeText;
    }
};

// --- 5. SEARCH LOGIC (Optional / Placeholder) ---
function searchApps() {
    // Yeh function aapke search bar ke liye hai. Ise baad mein implement karenge.
    console.log("Searching...");
}
