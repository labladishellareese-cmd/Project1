const firebaseConfig = {
  apiKey: "AIzaSyBIm5wMHlxsbNk8jsC9mJ4Jui9PGhNaDI4",
  authDomain: "attendance-a9f46.firebaseapp.com",
  projectId: "attendance-a9f46",
  storageBucket: "attendance-a9f46.firebasestorage.app",
  messagingSenderId: "282648390207",
  appId: "1:282648390207:web:27c5ec34b513d76212e68a",
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();