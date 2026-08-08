import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
// VIP UPDATE: Real-time chat ke liye zaroori database tools import kiye hain
import { getFirestore, collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

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

// Global VIP Variables (Current user ka data aur chat listener ko sambhalne ke liye)
let currentUser = null;
let currentChatUnsubscribe = null; 

const authScreen = document.getElementById('authScreen');
const loginPanel = document.getElementById('loginPanel');
const loadingPanel = document.getElementById('loadingPanel');
const mainInterface = document.getElementById('mainInterface');

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user; // User save kar liya
        loginPanel.style.display = 'none';
        loadingPanel.style.display = 'block';
        
        setTimeout(() => {
            authScreen.style.display = 'none';
            mainInterface.style.display = 'flex';
            
            document.getElementById('myName').innerText = user.displayName;
            document.getElementById('myAvatar').innerText = user.displayName.substring(0,2).toUpperCase();
        }, 1200);
    } else {
        currentUser = null;
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
        let status = "Available";
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
    
    // Naya VIP Function: Chat khulte hi database se puranay messages load karega
    loadRealtimeMessages(userName);
}

window.closeChatWindow = function() { 
    document.getElementById('privateChatWindow').style.display = 'none'; 
    // Agar chat band ki toh background listener bhi band kardo taake speed fast rahay
    if(currentChatUnsubscribe) currentChatUnsubscribe();
}

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

// --- ASLI FIREBASE DATABASE MESSAGING SYSTEM ---
function loadRealtimeMessages(targetName) {
    if(!currentUser) return;
    const msgArea = document.getElementById('chatMessagesArea');
    
    // Dono users ke darmian ek private Room ID create ho rahi hai (e.g., Ali_Usman)
    const roomID = [currentUser.displayName, targetName].sort().join("_");

    // Purani dummy chat clear kar ke Loading dikhaye ga
    msgArea.innerHTML = `<div style="text-align: center; color: rgba(255,255,255,0.5); font-size: 0.75rem; margin-top: 15px; margin-bottom: 20px;">Fetching secure messages...</div>`;

    if(currentChatUnsubscribe) currentChatUnsubscribe(); 

    // Firebase Query: Sirf is room ki chat dhoondo aur time ke hisab se line mein lagao
    const q = query(collection(db, "private_chats"), where("roomID", "==", roomID), orderBy("timestamp", "asc"));
    
    currentChatUnsubscribe = onSnapshot(q, (snapshot) => {
        msgArea.innerHTML = `<div style="text-align: center; color: rgba(255,255,255,0.5); font-size: 0.75rem; margin-top: 15px; margin-bottom: 20px;">Secure connection established with ${targetName}</div>`;
        
        snapshot.forEach((doc) => {
            const data = doc.data();
            const isMe = data.sender === currentUser.displayName;
            const timeStr = data.timestamp ? new Date(data.timestamp.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now';
            
            // Agar aapne bheja toh Right par Blue bubble, agar usne bheja toh Left par Grey Bubble
            const msgHtml = `
                <div class="message-row ${isMe ? 'sent' : 'received'}">
                    <div class="chat-bubble">${data.text}</div>
                    <div class="chat-time">${timeStr}</div>
                </div>
            `;
            msgArea.innerHTML += msgHtml;
        });
        // Scroll ko hamesha neeche rakho naye message par
        msgArea.scrollTop = msgArea.scrollHeight;
    });
}

// Asli Sending Message Logic
window.sendPrivateMessage = async function() {
    const input = document.getElementById('chatInputMsg');
    const msg = input.value.trim();
    const targetName = document.getElementById('chatTargetName').innerText;

    if(msg && currentUser && targetName) {
        input.value = '';
        document.getElementById('emoticonPanel').style.display = 'none'; 
        
        const roomID = [currentUser.displayName, targetName].sort().join("_");
        
        try {
            // Database mein add karo!
            await addDoc(collection(db, "private_chats"), {
                roomID: roomID,
                sender: currentUser.displayName,
                receiver: targetName,
                text: msg,
                timestamp: serverTimestamp() // Asli Google server ka time
            });
        } catch(error) {
            console.error("Error sending message:", error);
            alert("Failed to send message. Firebase Indexing lag sakti hai agar ye pehli baar hai.");
        }
    }
};

document.getElementById('chatInputMsg').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') { window.sendPrivateMessage(); }
});

document.getElementById('btnChat').addEventListener('click', () => alert("Click on any user in the list to start chatting."));
document.getElementById('btnRooms').addEventListener('click', () => alert("Global Room browser will open here."));
