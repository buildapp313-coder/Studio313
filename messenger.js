import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyBb_IjN3EtsHuhMP8b5U6_xUEfYf80Gaoc",
    authDomain: "studio313-hq.firebaseapp.com",
    projectId: "studio313-hq",
    storageBucket: "studio313-hq.firebasestorage.app",
    messagingSenderId: "328116481829",
    appId: "1:328116481829:web:6cba13235e85ea76e174cc"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// UI Elements
const authScreen = document.getElementById('authScreen');
const mainInterface = document.getElementById('mainInterface');
const btnGoogleLogin = document.getElementById('btnGoogleLogin');
const btnLogout = document.getElementById('btnLogout');
const btnAddContact = document.getElementById('btnAddContact');
const myName = document.getElementById('myName');
const myAvatar = document.getElementById('myAvatar');
const rightPanel = document.getElementById('privateChatPanel');
const btnCloseChat = document.getElementById('btnCloseChat');

// User Authentication State
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User logged in
        authScreen.style.display = 'none';
        mainInterface.style.display = 'flex';
        
        myName.innerText = user.displayName;
        myAvatar.innerText = user.displayName.substring(0, 2).toUpperCase();
        
        // List is intentionally kept empty here as per instructions.
        // It will only populate when we add database fetch logic later.
        
    } else {
        // User logged out
        authScreen.style.display = 'flex';
        mainInterface.style.display = 'none';
    }
});

// Login & Logout Actions
btnGoogleLogin.addEventListener('click', () => {
    btnGoogleLogin.innerText = "Authenticating...";
    signInWithPopup(auth, provider).catch(err => {
        console.error(err);
        btnGoogleLogin.innerText = "Connect Google ID";
    });
});

btnLogout.addEventListener('click', () => signOut(auth));

// Add Contact (+) Button Action
btnAddContact.addEventListener('click', () => {
    // Basic prompt for now, we will make a VIP Glass popup for this next
    const targetId = prompt("Enter User ID or Email to search and add to contacts:");
    if(targetId) {
        alert("Search initiated for: " + targetId + "\n(Backend search logic will be connected next!)");
    }
});

// Room/Contact Click Action (Slide in the Right Panel)
document.querySelectorAll('.room-item').forEach(item => {
    item.addEventListener('click', (e) => {
        // Get name from the clicked item
        const roomName = e.currentTarget.querySelector('.name').innerText;
        
        // Update Right Panel UI
        document.getElementById('chatTargetName').innerText = roomName;
        document.getElementById('chatTargetStatus').innerText = "Connected";
        document.getElementById('chatTargetAvatar').innerText = roomName.substring(0, 1);
        
        // Enable input
        document.querySelector('.glass-input').disabled = false;
        document.querySelector('.send-btn').disabled = false;
        
        // Show Right Panel
        rightPanel.classList.add('active');
        
        // Update messages area temporarily
        document.getElementById('privateMessages').innerHTML = `
            <div style="text-align: center; color: rgba(255,255,255,0.5); font-size: 0.8rem; margin: 20px 0;">
                Secure connection established to ${roomName}
            </div>
        `;
    });
});

// Close Right Panel
btnCloseChat.addEventListener('click', () => {
    rightPanel.classList.remove('active');
    document.querySelector('.glass-input').disabled = true;
    document.querySelector('.send-btn').disabled = true;
});
