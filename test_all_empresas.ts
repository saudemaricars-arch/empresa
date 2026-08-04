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
  } catch (err: any) {
    console.error(`❌ Error on ${colName} for empresa ${id}:`, err.message);
  }
}

async function run() {
  const empresasSnap = await getDocs(query(collection(db, 'empresas'), orderBy('criadoEm', 'desc')));
  
  for (const doc of empresasSnap.docs) {
    const id = doc.id;
    console.log(`Testing empresa ${id}...`);
    await testQuery('sugestoes', id);
    await testQuery('denuncias', id);
    await testQuery('atestados', id);
    await testQuery('auxilios', id);
    await testQuery('apoioSaude', id);
    await testQuery('segurancaTrabalho', id);
    
    try {
      const q = query(collection(db, 'empresas', id, 'noticias'), orderBy('data', 'desc'));
      await getDocs(q);
    } catch(err: any) {
      console.error(`❌ Error on noticias for empresa ${id}:`, err.message);
    }
  }
  
  console.log("Done testing all empresas.");
  process.exit(0);
}

run();
