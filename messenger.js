import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, setDoc, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

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

let currentUser = null;
let currentChatUnsubscribe = null;
let currentRoomID = null;
let currentChatType = null;

// Auth & Real-time Online Tracking
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        document.getElementById('loginPanel').style.display = 'none';
        document.getElementById('loadingPanel').style.display = 'block';
        
        try {
            await setDoc(doc(db, "online_users", user.uid), {
                uid: user.uid, name: user.displayName, email: user.email, status: "Online"
            });
        } catch(e) { console.error("Firestore Rules issue!"); }

        setTimeout(() => {
            document.getElementById('authScreen').style.display = 'none';
            document.getElementById('mainInterface').style.display = 'flex';
            document.getElementById('myName').innerText = user.displayName;
            document.getElementById('myAvatar').innerText = user.displayName.substring(0,2).toUpperCase();
        }, 1200);

        // ONLINE USERS LIST (Fixed Click Arguments)
        onSnapshot(collection(db, "online_users"), (snapshot) => {
            const list = document.getElementById('onlineUsersList');
            list.innerHTML = '';
            let count = 0;
            snapshot.forEach(doc => {
                const data = doc.data();
                if(data.uid !== user.uid) { 
                    count++;
                    list.innerHTML += `
                        <li class="list-item" onclick="window.openChatWindow('${data.name}', '${data.uid}', 'private')">
                            <div class="item-icon icon-online"></div>
                            <div>
                                <div class="item-name">${data.name}</div>
                                <div class="item-sub">Online (Click to Chat)</div>
                            </div>
                        </li>
                    `;
                }
            });
            document.getElementById('onlineCountHeader').innerText = `▼ Online Users (${count})`;
            if(count === 0) list.innerHTML = `<div style="padding: 15px; text-align: center; color: rgba(255,255,255,0.5); font-size: 0.75rem;">No one is online right now.</div>`;
        });

    } else {
        if(currentUser) { deleteDoc(doc(db, "online_users", currentUser.uid)); }
        currentUser = null;
        document.getElementById('authScreen').style.display = 'flex';
        document.getElementById('mainInterface').style.display = 'none';
        document.getElementById('privateChatWindow').style.display = 'none'; 
    }
});

document.getElementById('btnGoogleLogin').addEventListener('click', () => signInWithPopup(auth, provider));
const performSignOut = () => signOut(auth);
document.getElementById('btnLogout').addEventListener('click', performSignOut);
document.getElementById('dropSignOut').addEventListener('click', performSignOut);

// UI Toggles (Made Global)
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

window.toggleDropdown = function(dropId, event) {
    event.stopPropagation();
    document.querySelectorAll('.glass-dropdown').forEach(d => d.style.display = 'none');
    const drop = document.getElementById(dropId);
    if(drop) drop.style.display = 'block';
}
window.addEventListener('click', () => { document.querySelectorAll('.glass-dropdown').forEach(d => d.style.display = 'none'); });


// VIP CHAT SYSTEM (Bypass Indexing - 100% Working)
window.openChatWindow = function(targetName, targetId, chatType) {
    document.getElementById('chatTargetName').innerText = targetName;
    document.getElementById('chatTargetStatus').innerText = chatType === 'hub' ? "Global Public Room" : "Secure Private Connection";
    document.getElementById('privateChatWindow').style.display = 'flex';
    
    // Yahan Room ID bilkul theek banegi ab!
    currentRoomID = chatType === 'hub' ? `HUB_${targetId}` : [currentUser.uid, targetId].sort().join("_");
    currentChatType = chatType;

    const msgArea = document.getElementById('chatMessagesArea');
    msgArea.innerHTML = `<div style="text-align: center; color: rgba(255,255,255,0.5); font-size: 0.75rem; margin-top: 15px; margin-bottom: 20px;">Connected to ${targetName}</div>`;

    if(currentChatUnsubscribe) currentChatUnsubscribe();

    const q = query(collection(db, "chat_rooms", currentRoomID, "messages"), orderBy("timestamp", "asc"));
    
    currentChatUnsubscribe = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
                const data = change.doc.data();
                const isMe = data.senderUid === currentUser.uid;
                
                let timeStr = 'Just now';
                if (data.timestamp) {
                    const dateObj = data.timestamp.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
                    timeStr = dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                }
                
                const nameTag = (!isMe && chatType === 'hub') ? `<div style="font-size:0.6rem; color:#fde047; margin-bottom:2px;">${data.senderName}</div>` : '';

                msgArea.innerHTML += `
                    <div class="message-row ${isMe ? 'sent' : 'received'}">
                        <div class="chat-bubble">${nameTag}${data.text}</div>
                        <div class="chat-time">${timeStr}</div>
                    </div>
                `;
            }
        });
        msgArea.scrollTop = msgArea.scrollHeight;
    });
}

window.closeChatWindow = function() { 
    document.getElementById('privateChatWindow').style.display = 'none'; 
    if(currentChatUnsubscribe) currentChatUnsubscribe();
}

window.toggleEmoticons = function() {
    const panel = document.getElementById('emoticonPanel');
    panel.style.display = panel.style.display === 'grid' ? 'none' : 'grid';
}
window.addEmoji = function(emoji) {
    const input = document.getElementById('chatInputMsg');
    input.value += emoji;
    input.focus();
}

// SUPER FAST Sending Message Logic with 24-Hour Auto-Delete
window.sendVIPMessage = async function() {
    const input = document.getElementById('chatInputMsg');
    const msg = input.value.trim();

    if(msg && currentUser && currentRoomID) {
        input.value = '';
        document.getElementById('emoticonPanel').style.display = 'none'; 
        
        // Expiry time set ho raha hai (Current Time + 24 Hours)
        let expireTime = new Date();
        expireTime.setHours(expireTime.getHours() + 24);

        try {
            await addDoc(collection(db, "chat_rooms", currentRoomID, "messages"), {
                senderUid: currentUser.uid,
                senderName: currentUser.displayName,
                text: msg,
                timestamp: new Date(), 
                expireAt: expireTime // Firebase isko dekh kar khud delete karega!
            });
        } catch(error) {
            console.error("Error sending message:", error);
            alert("Database Error! Firestore rules check karein.");
        }
    }
};

document.getElementById('chatInputMsg').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') { window.sendVIPMessage(); }
});

// Remove old global event listener that was blocking clicks!
document.getElementById('btnAdd').addEventListener('click', () => window.openAddPopup());
window.openAddPopup = function() { document.getElementById('addContactPopup').style.display = 'flex'; }
window.closeAddPopup = function() { document.getElementById('addContactPopup').style.display = 'none'; document.getElementById('newContactInput').value = ''; }

window.submitAddContact = function() { alert("Use the Online List to click and chat with actual users!"); window.closeAddPopup(); }

// TAB YA BROWSER CLOSE HONE PAR USER KO OFFLINE KARNE KA CODE
window.addEventListener('beforeunload', function (e) {
    if (currentUser) {
        // Browser band hote hi user ka data online list se urr jayega
        deleteDoc(doc(db, "online_users", currentUser.uid));
    }
});
