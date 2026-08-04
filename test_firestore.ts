import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, orderBy, getDocs } from 'firebase/firestore';

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

async function testQuery(colName: string, id: string) {
  try {
    const q = query(collection(db, 'empresas', id, colName), orderBy('criadoEm', 'desc'));
    await getDocs(q);
    console.log(`✅ Success: ${colName}`);
  } catch (err: any) {
    console.error(`❌ Error on ${colName}:`, err.message);
  }
}

async function run() {
  console.log("Fetching empresas...");
  const empresasSnap = await getDocs(query(collection(db, 'empresas'), orderBy('criadoEm', 'desc')));
  
  if (empresasSnap.empty) {
    console.log("No empresas found. Testing with a dummy id.");
    await testQuery('apoioSaude', 'dummy');
    await testQuery('segurancaTrabalho', 'dummy');
    await testQuery('auxilios', 'dummy');
  } else {
    const id = empresasSnap.docs[0].id;
    console.log(`Found empresa ${id}. Testing subcollections...`);
    
    await testQuery('sugestoes', id);
    await testQuery('denuncias', id);
    await testQuery('atestados', id);
    await testQuery('auxilios', id);
    await testQuery('apoioSaude', id);
    await testQuery('segurancaTrabalho', id);
  }
  
  // also test noticias which uses orderBy('data')
  try {
    const id = empresasSnap.empty ? 'dummy' : empresasSnap.docs[0].id;
    const q = query(collection(db, 'empresas', id, 'noticias'), orderBy('data', 'desc'));
    await getDocs(q);
    console.log(`✅ Success: noticias`);
  } catch(err: any) {
    console.error(`❌ Error on noticias:`, err.message);
  }
  
  process.exit(0);
}

run();
