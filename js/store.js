// Data layer. Uses Firebase (Firestore + Auth) when configured, otherwise demo data in localStorage.

const store = (() => {
const COLLECTIONS = ['players', 'matches', 'announcements'];
const mode = FIREBASE.apiKey ? 'live' : 'demo';

const FIREBASE_VERSION = '10.12.2';
let fb;

async function firebase() {
  if (fb) return fb;
  const base = `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}`;
  const [{ initializeApp }, fs, fa] = await Promise.all([
    import(`${base}/firebase-app.js`),
    import(`${base}/firebase-firestore.js`),
    import(`${base}/firebase-auth.js`),
  ]);
  const app = initializeApp(FIREBASE);
  fb = { fs, fa, db: fs.getFirestore(app), auth: fa.getAuth(app) };
  return fb;
}

// ---- demo storage ----
const DEMO_KEY = 'lfgolf-demo-v1';
const COACH_KEY = 'lfgolf-demo-coach';

function demoRead() {
  try {
    const saved = localStorage.getItem(DEMO_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return structuredClone(SAMPLE);
}

function demoWrite(data) {
  try { localStorage.setItem(DEMO_KEY, JSON.stringify(data)); } catch {}
}

function resetDemo() {
  try { localStorage.removeItem(DEMO_KEY); } catch {}
}

const newId = () => Math.random().toString(36).slice(2, 10);

// ---- reads & writes ----
async function list(col) {
  if (mode === 'demo') return demoRead()[col] ?? [];
  const { fs, db } = await firebase();
  const snap = await fs.getDocs(fs.collection(db, col));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function loadAll() {
  const [players, matches, announcements] = await Promise.all(COLLECTIONS.map(list));
  return { players, matches, announcements };
}

async function save(col, record) {
  const { id, ...data } = record;
  if (mode === 'demo') {
    const all = demoRead();
    const arr = (all[col] ??= []);
    const rec = { id: id || newId(), ...data };
    const i = arr.findIndex((x) => x.id === rec.id);
    if (i >= 0) arr[i] = rec; else arr.push(rec);
    demoWrite(all);
    return rec.id;
  }
  const { fs, db } = await firebase();
  if (id) {
    await fs.setDoc(fs.doc(db, col, id), data);
    return id;
  }
  const ref = await fs.addDoc(fs.collection(db, col), data);
  return ref.id;
}

async function remove(col, id) {
  if (mode === 'demo') {
    const all = demoRead();
    all[col] = (all[col] ?? []).filter((x) => x.id !== id);
    demoWrite(all);
    return;
  }
  const { fs, db } = await firebase();
  await fs.deleteDoc(fs.doc(db, col, id));
}

// ---- coach auth ----
async function isCoach() {
  if (mode === 'demo') {
    try { return sessionStorage.getItem(COACH_KEY) === '1'; } catch { return false; }
  }
  const { auth } = await firebase();
  await auth.authStateReady();
  return !!auth.currentUser;
}

async function login(passcode) {
  if (mode === 'demo') {
    if (passcode !== DEMO_PASSCODE) return false;
    try { sessionStorage.setItem(COACH_KEY, '1'); } catch {}
    return true;
  }
  const { fa, auth } = await firebase();
  try {
    await fa.signInWithEmailAndPassword(auth, COACH_EMAIL, passcode);
    return true;
  } catch {
    return false;
  }
}

async function logout() {
  if (mode === 'demo') {
    try { sessionStorage.removeItem(COACH_KEY); } catch {}
    return;
  }
  const { fa, auth } = await firebase();
  await fa.signOut(auth);
}

return { COLLECTIONS, mode, resetDemo, list, loadAll, save, remove, isCoach, login, logout };
})();
