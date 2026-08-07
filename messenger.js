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

// UI Elements (Mapped to current HTML safely)
const authScreen = document.getElementById('authScreen');
const mainInterface = document.getElementById('mainInterface');
const loginPanel = document.getElementById('loginPanel'); // Added for smooth transition
const loadingPanel = document.getElementById('loadingPanel'); // Added for smooth transition
const btnGoogleLogin = document.getElementById('btnGoogleLogin');
const btnLogout = document.getElementById('btnLogout');

// Using ID from current HTML, falling back to old ID just in case
const btnAddContact = document.getElementById('btnAdd') || document.getElementById('btnAddContact');
const myName = document.getElementById('myName');
const myAvatar = document.getElementById('myAvatar');

// Side Chat Panel Elements (Made safe so it doesn't crash if HTML isn't added yet)
const rightPanel = document.getElementById('privateChatPanel');
const btnCloseChat = document.getElementById('btnCloseChat');

// User Authentication State
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User logged in: Premium Smooth Transition
        if(loginPanel && loadingPanel) {
            loginPanel.style.display = 'none';
            loadingPanel.style.display = 'block';
        }
        
        setTimeout(() => {
            if(authScreen) authScreen.style.display = 'none';
            if(mainInterface) mainInterface.style.display = 'flex';
            
            if(myName) myName.innerText = user.displayName;
            if(myAvatar) myAvatar.innerText = user.displayName.substring(0, 2).toUpperCase();
        }, 1200);
        
        // List is intentionally kept empty here as per instructions.
        // It will only populate when we add database fetch logic later.
        
    } else {
        // User logged out
        if(authScreen) authScreen.style.display = 'flex';
        if(mainInterface) mainInterface.style.display = 'none';
        if(loginPanel) loginPanel.style.display = 'block';
        if(loadingPanel) loadingPanel.style.display = 'none';
    }
});

// Login & Logout Actions
if(btnGoogleLogin) {
    btnGoogleLogin.addEventListener('click', () => {
        btnGoogleLogin.innerText = "Authenticating...";
        signInWithPopup(auth, provider).catch(err => {
            console.error(err);
            btnGoogleLogin.innerText = "Sign in with Google";
        });
    });
}

if(btnLogout) {
    btnLogout.addEventListener('click', () => signOut(auth));
}

// Add Contact (+) Button Action
if(btnAddContact) {
    btnAddContact.addEventListener('click', () => {
        // Basic prompt for now, we will make a VIP Glass popup for this next
        const targetId = prompt("Enter User ID or Email to search and add to contacts:");
        if(targetId) {
            alert("Search initiated for: " + targetId + "\n(Backend search logic will be connected next!)");
        }
    });
}

// Room/Contact Click Action (Slide in the Right Panel)
document.querySelectorAll('.list-item').forEach(item => {
    item.addEventListener('click', (e) => {
        // Get name from the clicked item
        const nameElement = e.currentTarget.querySelector('.item-name');
        if(!nameElement) return;
        
        const roomName = nameElement.innerText;
        
        // If Right Panel exists in HTML, update and show it
        if(rightPanel) {
            document.getElementById('chatTargetName').innerText = roomName;
            document.getElementById('chatTargetStatus').innerText = "Connected";
            document.getElementById('chatTargetAvatar').innerText = roomName.substring(0, 1);
            
            // Enable input
            const glassInput = document.querySelector('.glass-input');
            const sendBtn = document.querySelector('.send-btn');
            if(glassInput) glassInput.disabled = false;
            if(sendBtn) sendBtn.disabled = false;
            
            // Show Right Panel
            rightPanel.classList.add('active');
            
            // Update messages area temporarily
            document.getElementById('privateMessages').innerHTML = `
                <div style="text-align: center; color: rgba(255,255,255,0.5); font-size: 0.8rem; margin: 20px 0;">
                    Secure connection established to ${roomName}
                </div>
            `;
        } else {
            // Temporary alert until HTML is added
            alert("Ready to open Private Chat for: " + roomName);
        }
    });
});

// Close Right Panel
if(btnCloseChat) {
    btnCloseChat.addEventListener('click', () => {
        if(rightPanel) rightPanel.classList.remove('active');
        const glassInput = document.querySelector('.glass-input');
        const sendBtn = document.querySelector('.send-btn');
        if(glassInput) glassInput.disabled = true;
        if(sendBtn) sendBtn.disabled = true;
    });
}
