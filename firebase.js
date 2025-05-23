// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.11/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.11/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.11/firebase-auth.js";
import { addDoc, collection } from "https://www.gstatic.com/firebasejs/9.6.11/firebase-firestore.js";
import { onSnapshot } from "https://www.gstatic.com/firebasejs/9.6.11/firebase-firestore.js";''

const firebaseConfig = {
  apiKey: "AIzaSyAfDQg2kbji5WpnGujFB11x4vj2Ox4akPY",
  authDomain: "assinaturas-86aca.firebaseapp.com",
  projectId: "assinaturas-86aca",
  storageBucket: "assinaturas-86aca.firebasestorage.app",
  messagingSenderId: "370042231241",
  appId: "1:370042231241:web:4c6a9f734bf89a13cef018",
  measurementId: "G-CZPDGKYELL"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, doc, setDoc, getDoc, auth };
