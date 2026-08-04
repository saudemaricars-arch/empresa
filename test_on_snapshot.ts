import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, orderBy, getDocs, onSnapshot } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDR2680TnGtrAZwMLDshDeRk_OSjb7c0Og",
  authDomain: "empresa-251ac.firebaseapp.com",
  projectId: "empresa-251ac",
  storageBucket: "empresa-251ac.firebasestorage.app",
  messagingSenderId: "681749321907",
  appId: "1:681749321907:web:e90df5f3c00cc61495b8c6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const q = query(collection(db, 'empresas'), orderBy('criadoEm', 'desc'));
  
  onSnapshot(
    q,
    async (snap) => {
      console.log(`onSnapshot triggered! Found ${snap.docs.length} empresas.`);
      process.exit(0);
    },
    (err) => {
      console.error('Snapshot listener error:', err.message);
      process.exit(1);
    }
  );
}

run();
