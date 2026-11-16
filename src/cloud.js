// Capa de datos en la nube (Firebase Firestore + Auth) para la app de extintores.
// Todas las colecciones empiezan con "ext_" para no mezclarse con la app de detectores/lámparas
// aunque se use el mismo proyecto de Firebase.
//
//   ext_usuarios/{uid}                     { nombre, usuario, email, rol:'admin'|'tecnico', activo, debeCambiar, creado }
//   ext_clientes/{cid}                     { nombre, lugar, frecuencia:'unica'|'semanal'|'mensual', dia, fijado, creadoPor, creado, ultimaVisita }
//   ext_clientes/{cid}/extintores/{eid}    { n, zona, area, marca, tipo, capacidad, serie, numero, recAnt, recProx, ph, baja }
//   ext_visitas/{vid}                      { cid, cliente, fecha, estado:'en_curso'|'terminada', creada, cerrada, creadoPor,
//                                            tecnicos:{uid:{nombre, visto}}, resumen, ultimaAct:{texto, t, by} }
//   ext_visitas/{vid}/revisiones/{eid}     { eid, c:{...}, obs, recAnt, recProx, ph, t, by, uid }
//   ext_config/general                     { retencionMeses }
import { initializeApp, deleteApp } from 'firebase/app';
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager, memoryLocalCache,
  doc, collection, setDoc, updateDoc, deleteDoc, addDoc, onSnapshot, writeBatch, getDoc, getDocs,
  getDocsFromServer, query, where, connectFirestoreEmulator, deleteField,
} from 'firebase/firestore';
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, connectAuthEmulator,
  createUserWithEmailAndPassword, updatePassword,
} from 'firebase/auth';

let CFG, db, auth;
const DOMINIO = 'sosfire.app'; // usuario "jorge" -> jorge@sosfire.app
const emailDe = (u) => (u.includes('@') ? u.trim().toLowerCase() : `${u.trim().toLowerCase()}@${DOMINIO}`);

function init(config) {
  CFG = config;
  const app = initializeApp(config);
  let localCache;
  try { localCache = persistentLocalCache({ tabManager: persistentMultipleTabManager() }); }
  catch (e) { localCache = memoryLocalCache(); }
  db = initializeFirestore(app, { localCache });
  auth = getAuth(app);
  if (config.emulator) {
    connectFirestoreEmulator(db, config.emulator.host, config.emulator.firestorePort);
    connectAuthEmulator(auth, `http://${config.emulator.host}:${config.emulator.authPort}`, { disableWarnings: true });
  }
}

// ---------- Sesión ----------
const onUser = (cb) => onAuthStateChanged(auth, cb);
const login = (usuario, pass) => signInWithEmailAndPassword(auth, emailDe(usuario), pass);
const logout = () => signOut(auth);
const cambiarClave = (nueva) => updatePassword(auth.currentUser, nueva);
const uid = () => auth.currentUser && auth.currentUser.uid;
const email = () => auth.currentUser && auth.currentUser.email;

// ---------- Usuarios ----------
const watchUsuario = (id, cb, err) => onSnapshot(doc(db, 'ext_usuarios', id), (s) => cb(s.exists() ? { id: s.id, ...s.data() } : null), err);
const watchUsuarios = (cb, err) => onSnapshot(collection(db, 'ext_usuarios'), (qs) => cb(qs.docs.map((d) => ({ id: d.id, ...d.data() }))), err);
const borrarUsuario = (id) => deleteDoc(doc(db, 'ext_usuarios', id));
const setUsuario = (id, data) => setDoc(doc(db, 'ext_usuarios', id), data, { merge: true });

// Crea la cuenta del técnico sin cerrar la sesión del administrador (usa una segunda conexión)
async function crearTecnico({ nombre, usuario, clave, rol = 'tecnico' }) {
  const sec = initializeApp(CFG, 'alta-' + Date.now());
  const a2 = getAuth(sec);
  if (CFG.emulator) connectAuthEmulator(a2, `http://${CFG.emulator.host}:${CFG.emulator.authPort}`, { disableWarnings: true });
  try {
    const cred = await createUserWithEmailAndPassword(a2, emailDe(usuario), clave);
    await setDoc(doc(db, 'ext_usuarios', cred.user.uid), {
      nombre, usuario: usuario.trim().toLowerCase(), email: emailDe(usuario), rol, activo: true, debeCambiar: true, creado: Date.now(),
    });
    await signOut(a2);
    return cred.user.uid;
  } finally { deleteApp(sec).catch(() => {}); }
}

// ---------- Clientes y sus extintores ----------
const watchClientes = (cb, err) => onSnapshot(collection(db, 'ext_clientes'), (qs) => cb(qs.docs.map((d) => ({ id: d.id, ...d.data() }))), err);
async function crearCliente(data) {
  const ref = doc(collection(db, 'ext_clientes'));
  setDoc(ref, { ...data, creado: Date.now() }).catch(() => {});
  return ref.id;
}
const updateCliente = (id, patch) => updateDoc(doc(db, 'ext_clientes', id), patch);
const watchExtintores = (cid, cb, err) => onSnapshot(collection(db, 'ext_clientes', cid, 'extintores'),
  (qs) => cb(qs.docs.map((d) => ({ id: d.id, ...d.data() }))), err);
function nuevoIdExtintor(cid) { return doc(collection(db, 'ext_clientes', cid, 'extintores')).id; }
const saveExtintor = (cid, eid, data) => setDoc(doc(db, 'ext_clientes', cid, 'extintores', eid), data, { merge: true });
async function addExtintores(cid, lista) {
  for (let i = 0; i < lista.length; i += 400) {
    const b = writeBatch(db);
    for (const e of lista.slice(i, i + 400)) b.set(doc(collection(db, 'ext_clientes', cid, 'extintores')), e);
    await b.commit();
  }
}

// ---------- Visitas ----------
const mapDocs = (qs) => qs.docs.map((d) => ({ id: d.id, ...d.data() }));
const watchVisitasCliente = (cid, cb, err) => onSnapshot(query(collection(db, 'ext_visitas'), where('cid', '==', cid)), (qs) => cb(mapDocs(qs)), err);
const watchVisitasDesde = (t, cb, err) => onSnapshot(query(collection(db, 'ext_visitas'), where('creada', '>=', t)), (qs) => cb(mapDocs(qs)), err);
const watchVisitasActivas = (cb, err) => onSnapshot(query(collection(db, 'ext_visitas'), where('estado', '==', 'en_curso')), (qs) => cb(mapDocs(qs)), err);
async function todasLasVisitas() {
  const ref = collection(db, 'ext_visitas');
  try { return mapDocs(await getDocsFromServer(ref)); } catch (e) { return mapDocs(await getDocs(ref)); }
}
function crearVisita(data) {
  const ref = doc(collection(db, 'ext_visitas'));
  setDoc(ref, { ...data, creada: Date.now(), estado: 'en_curso', tecnicos: {} }).catch(() => {});
  return ref.id;
}
const updateVisita = (vid, patch) => updateDoc(doc(db, 'ext_visitas', vid), patch);
const watchVisita = (vid, cb, err) => onSnapshot(doc(db, 'ext_visitas', vid), (s) => cb(s.exists() ? { id: s.id, ...s.data() } : null), err);
const watchRevisiones = (vid, cb, err) => onSnapshot(collection(db, 'ext_visitas', vid, 'revisiones'), { includeMetadataChanges: true },
  (qs) => cb(mapDocs(qs), !qs.metadata.fromCache), err);
async function revisiones(vid) {
  const ref = collection(db, 'ext_visitas', vid, 'revisiones');
  try { return mapDocs(await getDocsFromServer(ref)); } catch (e) { return mapDocs(await getDocs(ref)); }
}
const saveRevision = (vid, eid, rec) => (rec ? setDoc(doc(db, 'ext_visitas', vid, 'revisiones', eid), rec) : deleteDoc(doc(db, 'ext_visitas', vid, 'revisiones', eid)));
// Presencia: "estoy en esta visita" (se renueva cada minuto)
const presente = (vid, id, nombre) => updateDoc(doc(db, 'ext_visitas', vid), { [`tecnicos.${id}`]: { nombre, visto: Date.now() } });
const salir = (vid, id) => updateDoc(doc(db, 'ext_visitas', vid), { [`tecnicos.${id}.visto`]: 0 });
async function borrarVisita(vid) {
  const refs = (await getDocs(collection(db, 'ext_visitas', vid, 'revisiones'))).docs.map((d) => d.ref);
  for (let i = 0; i < refs.length; i += 450) { const b = writeBatch(db); refs.slice(i, i + 450).forEach((r) => b.delete(r)); await b.commit(); }
  await deleteDoc(doc(db, 'ext_visitas', vid));
}
// Borra un proyecto completo: sus visitas (con revisiones), sus extintores y el cliente. Solo el administrador (lo exigen las reglas).
async function borrarCliente(cid) {
  const vs = (await getDocs(query(collection(db, 'ext_visitas'), where('cid', '==', cid)))).docs;
  for (const v of vs) await borrarVisita(v.id);
  const refs = (await getDocs(collection(db, 'ext_clientes', cid, 'extintores'))).docs.map((d) => d.ref);
  for (let i = 0; i < refs.length; i += 450) { const b = writeBatch(db); refs.slice(i, i + 450).forEach((r) => b.delete(r)); await b.commit(); }
  await deleteDoc(doc(db, 'ext_clientes', cid));
}

// ---------- Configuración ----------
const watchConfig = (cb, err) => onSnapshot(doc(db, 'ext_config', 'general'), (s) => cb(s.exists() ? s.data() : {}), err);
const saveConfig = (c) => setDoc(doc(db, 'ext_config', 'general'), c, { merge: true });

window.Cloud = {
  init, onUser, login, logout, cambiarClave, uid, email, emailDe,
  watchUsuario, watchUsuarios, setUsuario, borrarUsuario, crearTecnico,
  watchClientes, crearCliente, updateCliente, watchExtintores, nuevoIdExtintor, saveExtintor, addExtintores,
  watchVisitasCliente, watchVisitasDesde, watchVisitasActivas, todasLasVisitas, crearVisita, updateVisita, watchVisita,
  watchRevisiones, revisiones, saveRevision, presente, salir, borrarVisita, borrarCliente,
  watchConfig, saveConfig, deleteField,
};
