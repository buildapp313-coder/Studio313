import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, setDoc, doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

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
window.currentRequestDoc = null;
window.currentRequestSender = null;

// Auth & Real-time Online Tracking
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        document.getElementById('loginPanel').style.display = 'none';
        document.getElementById('loadingPanel').style.display = 'block';
        
        // 1. Mark User as Online in DB
        await setDoc(doc(db, "online_users", user.uid), {
            uid: user.uid, name: user.displayName, email: user.email, status: "Online"
        });

        setTimeout(() => {
            document.getElementById('authScreen').style.display = 'none';
            document.getElementById('mainInterface').style.display = 'flex';
            document.getElementById('myName').innerText = user.displayName;
            document.getElementById('myAvatar').innerText = user.displayName.substring(0,2).toUpperCase();
        }, 1200);

        // 2. Listen to who else is Online
        onSnapshot(collection(db, "online_users"), (snapshot) => {
            const list = document.getElementById('onlineUsersList');
            list.innerHTML = '';
            let count = 0;
            snapshot.forEach(doc => {
                const data = doc.data();
                if(data.uid !== user.uid) { // Khud ko list mein nahi dikhana
                    count++;
                    list.innerHTML += `
                        <li class="list-item" onclick="sendFriendRequest('${data.uid}', '${data.name}')">
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

        // 3. Listen for Incoming Chat Requests
        onSnapshot(query(collection(db, "requests"), where("toUid", "==", user.uid), where("status", "==", "pending")), (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    const req = change.doc.data();
                    window.currentRequestDoc = change.doc.id;
                    window.currentRequestSender = { uid: req.fromUid, name: req.fromName };
                    document.getElementById('reqMessage').innerText = `${req.fromName} wants to connect with you!`;
                    document.getElementById('friendReqPopup').style.display = 'flex';
                }
            });
        });

        // 4. Listen for Accepted Requests (For the Sender)
        onSnapshot(query(collection(db, "requests"), where("fromUid", "==", user.uid)), (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "modified") {
                    const req = change.doc.data();
                    if(req.status === 'accepted') {
                        window.openChatWindow(req.toName, req.toUid, 'private');
                    }
                }
            });
        });

    } else {
        if(currentUser) { deleteDoc(doc(db, "online_users", currentUser.uid)); }
        currentUser = null;
        document.getElementById('authScreen').style.display = 'flex';
        document.getElementById('mainInterface').style.display = 'none';
        document.getElementById('privateChatWindow').style.display = 'none'; 
    }
});

// UI Basics
document.getElementById('btnGoogleLogin').addEventListener('click', () => signInWithPopup(auth, provider));
const performSignOut = () => signOut(auth);
document.getElementById('btnLogout').addEventListener('click', performSignOut);
document.getElementById('dropSignOut').addEventListener('click', performSignOut);

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

// Friend Request System
window.sendFriendRequest = async function(targetUid, targetName) {
    try {
        await addDoc(collection(db, "requests"), {
            fromUid: currentUser.uid, fromName: currentUser.displayName,
            toUid: targetUid, toName: targetName, status: 'pending', timestamp: serverTimestamp()
        });
        alert(`Chat request sent to ${targetName}! Waiting for them to accept.`);
    } catch(e) { 
        alert("Failed to send request. Is Firestore Rules set to allow write?"); 
    }
}

window.acceptRequest = async function() {
    document.getElementById('friendReqPopup').style.display = 'none';
    if(window.currentRequestDoc) {
        await updateDoc(doc(db, "requests", window.currentRequestDoc), { status: 'accepted' });
        window.openChatWindow(window.currentRequestSender.name, window.currentRequestSender.uid, 'private');
    }
}

window.rejectRequest = async function() {
    document.getElementById('friendReqPopup').style.display = 'none';
    if(window.currentRequestDoc) {
        await updateDoc(doc(db, "requests", window.currentRequestDoc), { status: 'rejected' });
    }
}

// Universal Chat System (Handles Both Hubs and Private)
window.openChatWindow = function(targetName, targetId, chatType) {
    document.getElementById('chatTargetName').innerText = targetName;
    document.getElementById('chatTargetStatus').innerText = chatType === 'hub' ? "Global Public Room" : "Secure Private Connection";
    document.getElementById('privateChatWindow').style.display = 'flex';
    
    currentRoomID = chatType === 'hub' ? `HUB_${targetId}` : [currentUser.uid, targetId].sort().join("_");
    currentChatType = chatType;

    const msgArea = document.getElementById('chatMessagesArea');
    msgArea.innerHTML = `<div style="text-align: center; color: rgba(255,255,255,0.5); font-size: 0.75rem; margin-top: 15px; margin-bottom: 20px;">Fetching secure messages...</div>`;

    if(currentChatUnsubscribe) currentChatUnsubscribe();

    const q = query(collection(db, "messages"), where("roomID", "==", currentRoomID), orderBy("timestamp", "asc"));
    
    currentChatUnsubscribe = onSnapshot(q, (snapshot) => {
        msgArea.innerHTML = `<div style="text-align: center; color: rgba(255,255,255,0.5); font-size: 0.75rem; margin-top: 15px; margin-bottom: 20px;">Connected to ${targetName}</div>`;
        
        snapshot.forEach((doc) => {
            const data = doc.data();
            const isMe = data.senderUid === currentUser.uid;
            const timeStr = data.timestamp ? new Date(data.timestamp.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now';
            
            // In Global Hubs, show the sender's name on top of the bubble
            const nameTag = (!isMe && chatType === 'hub') ? `<div style="font-size:0.6rem; color:#fde047; margin-bottom:2px;">${data.senderName}</div>` : '';

            msgArea.innerHTML += `
                <div class="message-row ${isMe ? 'sent' : 'received'}">
                    <div class="chat-bubble">${nameTag}${data.text}</div>
                    <div class="chat-time">${timeStr}</div>
                </div>
            `;
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

// Asli Sending Message Logic
window.sendVIPMessage = async function() {
    const input = document.getElementById('chatInputMsg');
    const msg = input.value.trim();

    if(msg && currentUser && currentRoomID) {
        input.value = '';
        document.getElementById('emoticonPanel').style.display = 'none'; 
        
        try {
            await addDoc(collection(db, "messages"), {
                roomID: currentRoomID,
                senderUid: currentUser.uid,
                senderName: currentUser.displayName,
                text: msg,
                timestamp: serverTimestamp() 
            });
        } catch(error) {
            console.error("Error sending message:", error);
            alert("Database Error! Firestore rules ko Console mein 'allow read, write: if true;' karein.");
        }
    }
};

document.getElementById('chatInputMsg').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') { window.sendVIPMessage(); }
});
