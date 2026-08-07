import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

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
const db = getFirestore(app);

const authScreen = document.getElementById('authScreen');
const loginPanel = document.getElementById('loginPanel');
const loadingPanel = document.getElementById('loadingPanel');
const mainInterface = document.getElementById('mainInterface');

onAuthStateChanged(auth, (user) => {
    if (user) {
        loginPanel.style.display = 'none';
        loadingPanel.style.display = 'block';
        
        setTimeout(() => {
            authScreen.style.display = 'none';
            mainInterface.style.display = 'flex';
            
            document.getElementById('myName').innerText = user.displayName;
            document.getElementById('myAvatar').innerText = user.displayName.substring(0,2).toUpperCase();
        }, 1200);
    } else {
        authScreen.style.display = 'flex';
        mainInterface.style.display = 'none';
        loginPanel.style.display = 'block';
        loadingPanel.style.display = 'none';
        document.getElementById('privateChatWindow').style.display = 'none'; 
    }
});

document.getElementById('btnGoogleLogin').addEventListener('click', () => signInWithPopup(auth, provider));

const performSignOut = () => signOut(auth);
document.getElementById('btnLogout').addEventListener('click', performSignOut);
document.getElementById('dropSignOut').addEventListener('click', performSignOut);

// UI Testing Mode Add Contact
window.submitAddContact = async function() {
    const val = document.getElementById('newContactInput').value.trim();
    if(!val) return alert("Please enter an Email ID to search.");
    try {
        let displayName = val.split('@')[0]; 
        let status = "Checking email right now...";
        const emptyMsg = document.querySelector('#onlineUsersList div');
        if(emptyMsg) emptyMsg.remove();
        
        const list = document.getElementById('onlineUsersList');
        list.innerHTML += `
            <li class="list-item">
                <div class="item-icon icon-online"></div>
                <div>
                    <div class="item-name">${displayName}</div>
                    <div class="item-sub">${status}</div>
                </div>
            </li>
        `;
        alert("✅ Successfully added " + displayName + " to your contacts!");
        window.closeAddPopup(); 
    } catch (error) {
        console.error("Error:", error);
    }
};

// Accordions
window.toggleList = function(listId, headerElement) {
    const list = document.getElementById(listId);
    const text = headerElement.innerText;
    if (list.style.display === 'none' || list.style.display === '') {
        list.style.display = 'block';
        headerElement.innerText = text.replace('▶', '▼');
    } else {
        list.style.display = 'none';
        headerElement.innerText = text.replace('▼', '▶');
    }
}

// Dropdowns
window.toggleDropdown = function(dropId, event) {
    event.stopPropagation();
    document.querySelectorAll('.glass-dropdown').forEach(d => d.style.display = 'none');
    const drop = document.getElementById(dropId);
    if(drop) drop.style.display = 'block';
}
window.addEventListener('click', () => { document.querySelectorAll('.glass-dropdown').forEach(d => d.style.display = 'none'); });

document.getElementById('menuActions').addEventListener('click', () => alert("User Actions menu will open here."));
document.getElementById('menuHelp').addEventListener('click', () => alert("Help Center will open here."));

// Add Contact Popups
document.getElementById('btnAdd').addEventListener('click', () => window.openAddPopup());
window.openAddPopup = function() { document.getElementById('addContactPopup').style.display = 'flex'; }
window.closeAddPopup = function() { document.getElementById('addContactPopup').style.display = 'none'; document.getElementById('newContactInput').value = ''; }

// VIP CHAT WINDOW LOGIC
window.openChatWindow = function(userName, userStatus) {
    document.getElementById('chatTargetName').innerText = userName;
    document.getElementById('chatTargetStatus').innerText = "Status Message: " + (userStatus || "Available");
    document.getElementById('privateChatWindow').style.display = 'flex';
}

window.closeChatWindow = function() { document.getElementById('privateChatWindow').style.display = 'none'; }

document.getElementById('mainListContainer').addEventListener('click', function(e) {
    const item = e.target.closest('.list-item');
    if(item) {
        const name = item.querySelector('.item-name').innerText;
        const status = item.querySelector('.item-sub').innerText;
        window.openChatWindow(name, status);
    }
});

// Chat Emoticons Logic
window.toggleEmoticons = function() {
    const panel = document.getElementById('emoticonPanel');
    panel.style.display = panel.style.display === 'grid' ? 'none' : 'grid';
}

window.addEmoji = function(emoji) {
    const input = document.getElementById('chatInputMsg');
    input.value += emoji;
    input.focus();
}

// Sending Message Logic
window.sendPrivateMessage = function() {
    const input = document.getElementById('chatInputMsg');
    const msg = input.value.trim();
    if(msg) {
        const msgArea = document.getElementById('chatMessagesArea');
        const now = new Date();
        let hours = now.getHours();
        let minutes = now.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12; hours = hours ? hours : 12;
        minutes = minutes < 10 ? '0' + minutes : minutes;
        const timeStr = hours + ':' + minutes + ' ' + ampm;

        const newMsg = `
            <div class="message-row sent">
                <div class="chat-bubble">${msg}</div>
                <div class="chat-time">${timeStr}</div>
            </div>
        `;
        
        msgArea.innerHTML += newMsg;
        input.value = '';
        document.getElementById('emoticonPanel').style.display = 'none'; 
        msgArea.scrollTop = msgArea.scrollHeight;
    }
};

document.getElementById('chatInputMsg').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') { window.sendPrivateMessage(); }
});

document.getElementById('btnChat').addEventListener('click', () => alert("Click on any user in the list to start chatting."));
document.getElementById('btnRooms').addEventListener('click', () => alert("Global Room browser will open here."));
