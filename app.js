import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js';
import { getFirestore, collection, addDoc, onSnapshot, doc, getDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';

// Firebase web configuration (public client configuration, not a private key).
const firebaseConfig = {
  apiKey: 'AIzaSyAOJ7wJriznPnfo1nd5xXzGmR7BjF4ODTs',
  authDomain: 'unity-express.firebaseapp.com',
  projectId: 'unity-express',
  storageBucket: 'unity-express.firebasestorage.app',
  messagingSenderId: '523679233301',
  appId: '1:523679233301:web:95e05af90e458b47dbe51c',
  measurementId: 'G-Q9X7PDZR96'
};

const MEMBERS = ['Namur Rahman', 'Md Rasel', 'Yeasin Arafat', 'MD Zakir', 'AM', 'Abran Raju', 'Saif', 'Konok'];
const TARGET = 200;
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const $ = (id) => document.getElementById(id);
let deposits = [];
let expenses = [];
let stopDeposits;
let stopExpenses;

function localDate() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function money(value) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value || 0); }
function safe(text) { return String(text ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function showMessage(id, text) { $(id).textContent = text; }
function displayError(error) {
  if (error.code === 'auth/email-already-in-use') return 'এই email দিয়ে account আগে থেকেই আছে। লগ ইন করুন।';
  if (error.code === 'auth/weak-password') return 'Password কমপক্ষে ৬ অক্ষরের দিন।';
  if (error.code === 'auth/invalid-credential') return 'Email বা password সঠিক নয়।';
  if (error.code === 'auth/operation-not-allowed') return 'Firebase Console-এ Authentication-এর Email/Password চালু করুন।';
  if (error.code === 'permission-denied' || error.code === 'firestore/permission-denied') return 'অনুমতি নেই। Firestore rules প্রকাশ হয়েছে এবং admin আপনার account অনুমোদন করেছেন কি না যাচাই করুন।';
  if (error.code === 'auth/network-request-failed') return 'ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।';
  return error.message || 'কাজটি সম্পন্ন হয়নি। আবার চেষ্টা করুন।';
}
function showView(view) {
  for (const id of ['authView', 'pendingView', 'dashboard']) $(id).classList.toggle('hidden', id !== view);
}
function stopListeners() {
  if (stopDeposits) stopDeposits();
  if (stopExpenses) stopExpenses();
  stopDeposits = stopExpenses = undefined;
  deposits = []; expenses = [];
}
function render() {
  const thisMonth = localDate().slice(0, 7);
  const sum = (items) => items.reduce((total, item) => total + Number(item.amount || 0), 0);
  $('totalDeposits').textContent = money(sum(deposits));
  $('totalExpenses').textContent = money(sum(expenses));
  $('balance').textContent = money(sum(deposits) - sum(expenses));
  $('memberRows').innerHTML = MEMBERS.map((name) => {
    const memberEntries = deposits.filter((item) => item.member === name);
    const monthTotal = sum(memberEntries.filter((item) => String(item.date || '').startsWith(thisMonth)));
    return `<tr><td class="member-name">${safe(name)}</td><td>${money(monthTotal)}</td><td>${money(sum(memberEntries))}</td><td><span class="status ${monthTotal >= TARGET ? 'paid' : 'due'}">${monthTotal >= TARGET ? 'জমা হয়েছে' : 'বাকি'}</span></td></tr>`;
  }).join('');
  const sorted = [...expenses].sort((a, b) => String(b.date).localeCompare(String(a.date)));
  $('expenseRows').innerHTML = sorted.length ? sorted.map((item) => `<article class="activity"><div><strong>${safe(item.description)}</strong><small>${safe(item.date)} · ${safe(item.recorder || 'Group member')}</small></div><b>− ${money(item.amount)}</b></article>`).join('') : '<p class="empty">এখনও কোনো খরচ যোগ করা হয়নি।</p>';
}
function watchLedger(user) {
  stopListeners();
  stopDeposits = onSnapshot(collection(db, 'deposits'), (snapshot) => {
    deposits = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })); render();
  }, (error) => showMessage('authMessage', displayError(error)));
  stopExpenses = onSnapshot(collection(db, 'expenses'), (snapshot) => {
    expenses = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })); render();
  }, (error) => showMessage('authMessage', displayError(error)));
}

$('depositMember').innerHTML = MEMBERS.map((name) => `<option value="${safe(name)}">${safe(name)}</option>`).join('');
$('depositDate').value = localDate();
$('expenseDate').value = localDate();
$('connection').textContent = 'Firebase';
$('authForm').addEventListener('submit', async (event) => {
  event.preventDefault(); showMessage('authMessage', '');
  try { await signInWithEmailAndPassword(auth, $('email').value.trim(), $('password').value); }
  catch (error) { showMessage('authMessage', displayError(error)); }
});
$('signupButton').addEventListener('click', async () => {
  showMessage('authMessage', '');
  if (!$('authForm').reportValidity()) return;
  try { await createUserWithEmailAndPassword(auth, $('email').value.trim(), $('password').value); }
  catch (error) { showMessage('authMessage', displayError(error)); }
});
$('signoutButton').addEventListener('click', () => signOut(auth));
$('pendingSignout').addEventListener('click', () => signOut(auth));
onAuthStateChanged(auth, async (user) => {
  stopListeners();
  if (!user) { showView('authView'); $('userEmail').textContent = ''; return; }
  $('userEmail').textContent = user.email || '';
  try {
    const member = await getDoc(doc(db, 'members', user.uid));
    if (!member.exists() || member.data().active !== true) { showView('pendingView'); return; }
    showView('dashboard'); watchLedger(user);
  } catch (error) {
    showView('authView'); showMessage('authMessage', displayError(error));
  }
});
$('showDeposit').addEventListener('click', () => $('depositDialog').showModal());
$('showExpense').addEventListener('click', () => $('expenseDialog').showModal());
document.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', () => button.closest('dialog').close()));
for (const id of ['depositDialog', 'expenseDialog']) $(id).addEventListener('click', (event) => { if (event.target === event.currentTarget) event.currentTarget.close(); });
$('depositForm').addEventListener('submit', async (event) => {
  event.preventDefault(); showMessage('depositMessage', '');
  const amount = Number($('depositAmount').value);
  if (!Number.isFinite(amount) || amount <= 0) return showMessage('depositMessage', 'সঠিক পরিমাণ লিখুন।');
  try {
    await addDoc(collection(db, 'deposits'), { member: $('depositMember').value, amount, date: $('depositDate').value, note: $('depositNote').value.trim(), createdBy: auth.currentUser.uid, createdAt: serverTimestamp() });
    event.target.reset(); $('depositDate').value = localDate(); $('depositAmount').value = TARGET; $('depositDialog').close();
  } catch (error) { showMessage('depositMessage', displayError(error)); }
});
$('expenseForm').addEventListener('submit', async (event) => {
  event.preventDefault(); showMessage('expenseMessage', '');
  const amount = Number($('expenseAmount').value);
  const description = $('expenseDescription').value.trim();
  if (!description || !Number.isFinite(amount) || amount <= 0) return showMessage('expenseMessage', 'বিবরণ ও সঠিক পরিমাণ লিখুন।');
  try {
    await addDoc(collection(db, 'expenses'), { description, amount, date: $('expenseDate').value, recorder: auth.currentUser.email || 'Group member', createdBy: auth.currentUser.uid, createdAt: serverTimestamp() });
    event.target.reset(); $('expenseDate').value = localDate(); $('expenseDialog').close();
  } catch (error) { showMessage('expenseMessage', displayError(error)); }
});
