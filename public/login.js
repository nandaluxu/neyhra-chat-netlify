/* ===== Halaman Masuk / Daftar (layar penuh) + pilih username =====
   Dimuat setelah semua tab, sebelum router.js. Dipanggil lewat openLogin() dari halaman yang butuh akun (Profil, Bonus, Minigame, Toko, Chat Global, Skrip).
   Tampilan: halaman penuh yang menutupi seluruh #app (tanpa rail navigasi). Desktop: form Masuk di kiri; pindah ke Daftar = form bergeser ke kanan
   dan panel brand bergeser ke kiri. Mobile: tab Masuk | Daftar. Tombol "Beranda" menutup halaman dan membuka Beranda. Alamat: /login (router.js).
   Memakai global index.html: $, store, atok, aApi, authGo, initAcct, setA, Shell (let/const/function global, akses langsung).
   Google: Google Identity Services (token ID dikirim ke /api/auth/google atau /api/auth/google/link, diverifikasi server di lib/google.js).
   Tombol Google hanya muncul kalau server punya env GOOGLE_CLIENT_ID (dibaca dari /api/auth/config).
   API global: openLogin() | openLogin('register') | openLogin(2) (pilih username), closeLogin(), isLoginOpen(). */
(() => {
'use strict';
const $ = id => document.getElementById(id);
const app = $('app');

const I = {
  back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  user: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 20c1-4 4-6 8-6s7 2 8 6"/></svg>',
  lock: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 018 0v2.5"/></svg>',
  at: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.6"/><path d="M15.6 12v1.4a2.6 2.6 0 005.2 0V12a8.8 8.8 0 10-3.4 6.9"/></svg>',
  eye: '<svg class="see" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg><svg class="off" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 5.1A9.7 9.7 0 0112 5c6.4 0 10 7 10 7a17 17 0 01-3.2 4M6.7 6.7A17 17 0 002 12s3.6 7 10 7c1.5 0 2.9-.3 4.1-.8M9.9 9.9a3 3 0 004.2 4.2"/></svg>',
};
const pwField = (id, label, auto, ph) => `<label class="lfld"><span>${label}</span><div class="lin pw">${I.lock}<input id="${id}" type="password" autocomplete="${auto}" maxlength="100" placeholder="${ph}"><button class="leye" type="button" data-eye="${id}" aria-label="Tampilkan password" aria-pressed="false">${I.eye}</button></div></label>`;

const page = document.createElement('div');
page.id = 'lpage'; page.className = 'hide'; page.dataset.mode = 'login';
page.setAttribute('role', 'dialog'); page.setAttribute('aria-modal', 'true'); page.setAttribute('aria-label', 'Masuk');
page.innerHTML = `
<button class="lback" id="lback" type="button" aria-label="Kembali ke beranda">${I.back}<span class="lb-short">Beranda</span><span class="lb-long">Kembali ke beranda</span></button>

<aside class="lbrand" aria-hidden="false">
  <div class="lb-in">
    <div class="lb-logo"><img src="/icon.svg" alt="" draggable="false"><span>Neyhra Chat</span></div>
    <div class="lb-mob lm-login"><h2>Selamat datang kembali</h2><p>Lanjutkan obrolanmu di mana saja.</p></div>
    <div class="lb-mob lm-reg"><h2>Buat akunmu</h2><p>Gratis, dan obrolanmu ikut tersimpan.</p></div>
    <div class="lb-mob lm-name"><h2>Satu langkah lagi</h2><p>Pilih username untuk akunmu.</p></div>
    <div class="lb-stage">
      <div class="lb-copy lb-to-reg">
        <h2>Baru di Neyhra Chat?</h2>
        <p>Buat akun gratis. Obrolan, coin, dan bonus harianmu tersimpan dan ikut ke perangkat mana pun.</p>
        <button class="lb-cta" id="lctareg" type="button">Daftar sekarang ${I.arrow}</button>
      </div>
      <div class="lb-copy lb-to-login">
        <h2>Sudah punya akun?</h2>
        <p>Masuk untuk melanjutkan obrolan, klaim bonus, dan lihat peringkatmu.</p>
        <button class="lb-cta" id="lctalogin" type="button">Masuk ${I.arrow}</button>
      </div>
      <div class="lb-bubbles" aria-hidden="true">
        <div class="lbb">Kamu datang lagi! Aku udah nungguin dari tadi~</div>
        <div class="lbb me">Maaf telat, ada yang mau aku ceritain nih</div>
        <div class="lbb">Ayo, cerita aja. Aku dengerin.</div>
      </div>
    </div>
  </div>
</aside>

<section class="lform">
  <div class="ltabs" role="tablist" aria-label="Masuk atau daftar">
    <button type="button" role="tab" data-go="login">Masuk</button>
    <button type="button" role="tab" data-go="register">Daftar</button>
  </div>
  <div class="lf-scroll" id="lscroll"><div class="lf-wrap">

    <form class="lf lf-login" id="lstep1" novalidate>
      <h1>Masuk</h1>
      <p class="lsub">Masuk untuk memakai profil, bonus, coin, dan memindahkan obrolan ke perangkat lain.</p>
      <div id="lgwrap" class="lgw hide"><div id="lgbtn" class="lgb"></div><div class="lor"><span>atau pakai username</span></div></div>
      <label class="lfld first"><span>Username</span><div class="lin">${I.user}<input id="auser" type="text" autocomplete="username" autocapitalize="off" spellcheck="false" maxlength="20" placeholder="username kamu"></div></label>
      ${pwField('apass', 'Password', 'current-password', 'password kamu')}
      <button class="lprimary" id="alogin" type="submit"><i class="sp"></i><span>Masuk</span></button>
      <p id="lstat" class="lstat" role="status" aria-live="polite"></p>
      <p class="lswap">Belum punya akun? <button type="button" data-go="register">Daftar</button></p>
    </form>

    <form class="lf lf-reg" id="lreg" novalidate>
      <h1>Daftar</h1>
      <p class="lsub">Buat akun gratis supaya obrolan, coin, dan bonusmu tersimpan dan ikut ke perangkat lain.</p>
      <div id="rgwrap" class="lgw hide"><div id="rgbtn" class="lgb"></div><div class="lor"><span>atau buat dengan username</span></div></div>
      <label class="lfld first"><span>Username</span><div class="lin">${I.at}<input id="ruser" type="text" autocomplete="username" autocapitalize="off" spellcheck="false" maxlength="20" placeholder="pilih username"></div><p class="lhint">3-20 karakter: huruf, angka, titik, strip, atau garis bawah.</p></label>
      ${pwField('rpass', 'Password', 'new-password', 'minimal 6 karakter')}
      ${pwField('rpass2', 'Ulangi password', 'new-password', 'ketik lagi passwordnya')}
      <button class="lprimary" id="rdo" type="submit"><i class="sp"></i><span>Buat akun</span></button>
      <p id="rstat" class="lstat" role="status" aria-live="polite"></p>
      <p class="lswap">Sudah punya akun? <button type="button" data-go="login">Masuk</button></p>
    </form>

    <form class="lf lf-name" id="lstep2" novalidate>
      <h1>Pilih username</h1>
      <p class="lsub">Akunmu sudah dibuat. Pilih username unik (3-20 karakter: huruf, angka, titik, strip, garis bawah). Ini tidak bisa diganti lagi, nama tampilan tetap bisa diubah di Profil.</p>
      <label class="lfld first"><span>Username</span><div class="lin">${I.at}<input id="lun" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="20" placeholder="username" enterkeyhint="done"></div></label>
      <button class="lprimary" id="lunok" type="submit"><i class="sp"></i><span>Simpan</span></button>
      <button class="llink" id="lunskip" type="button">Lewati dulu</button>
      <p id="lstat2" class="lstat" role="status" aria-live="polite"></p>
    </form>

  </div></div>
</section>`;
app.append(page);

const f1 = $('lstep1'), f2 = $('lreg'), f3 = $('lstep2');
const forms = { login: f1, register: f2, username: f3 };
const say = (id, t, err) => { const el = $(id); el.textContent = t || ''; el.classList.toggle('err', !!err); };
const mkUi = (form, statId) => ({ set: (t, e) => say(statId, t, e), busy: on => form.classList.toggle('sbusy', on), ok: r => { if (!(r && r.needUsername)) close(); } }); /* ok: dipanggil authGo begitu login sukses — halaman menutup sendiri, sinkron lanjut di belakang layar (akun Google baru tetap dibuka untuk langkah pilih username) */
const uiLogin = mkUi(f1, 'lstat'), uiReg = mkUi(f2, 'rstat');
const uiCur = () => (mode === 'register' ? uiReg : uiLogin);
const isOpen = () => !page.classList.contains('hide');
const hover = () => matchMedia('(hover:hover)').matches;
const USER_RE = /^[a-z0-9_.-]{3,20}$/i;
const TITLES = { login: 'Masuk', register: 'Daftar', username: 'Pilih username' };
let mode = 'login', lastFocus = null, inerted = [];

/* ---------- mode: login | register | username ---------- */
function setMode(m, instant) {
  if (!forms[m]) m = 'login';
  const was = mode; mode = m;
  page.dataset.mode = m;
  page.setAttribute('aria-label', TITLES[m]);
  page.querySelectorAll('.ltabs [data-go]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.go === m)));
  $('lscroll').scrollTop = 0;
  if (m !== was || instant) {
    say('lstat', ''); say('rstat', ''); say('lstat2', '');
    for (const k in forms) forms[k].classList.remove('sbusy');
  }
  if (m === 'username') { say('lstat2', ''); setTimeout(() => { if (mode === 'username') $('lun').focus(); }, instant ? 60 : 520); }
  else if (hover() && isOpen()) setTimeout(() => { if (mode === m) $(m === 'login' ? 'auser' : 'ruser').focus(); }, instant ? 60 : 650);
  if (isOpen()) paintGoogle();
}

/* seluruh isi #app lain dibuat inert selama halaman terbuka: Tab tidak menembus ke rail/chat di belakang */
function lock(on) {
  if (on) { inerted = [...app.children].filter(el => el !== page && !el.inert); inerted.forEach(el => { el.inert = true; }); }
  else { inerted.forEach(el => { el.inert = false; }); inerted = []; }
}
function open(n) {
  if (typeof atok !== 'undefined' && atok && n !== 2) return; // sudah masuk
  const first = !isOpen();
  if (first) lastFocus = document.activeElement;
  setMode(n === 2 ? 'username' : n === 'register' ? 'register' : 'login', true);
  page.classList.remove('hide');
  app.classList.add('login-open'); // dibaca router.js (alamat /login)
  if (first) lock(true);
  if (n === 2) say('lstat2', '');
}
function close(opts) {
  if (!isOpen()) return;
  page.classList.add('hide');
  app.classList.remove('login-open');
  lock(false);
  for (const id of ['apass', 'rpass', 'rpass2']) { const el = $(id); el.value = ''; el.type = 'password'; }
  page.querySelectorAll('.leye').forEach(b => { b.classList.remove('on'); b.setAttribute('aria-pressed', 'false'); });
  if (!(opts && opts.noFocus)) { try { if (lastFocus && lastFocus.focus && document.contains(lastFocus)) lastFocus.focus(); } catch {} }
}
function home() { // tombol "Beranda": tutup halaman, lalu tampilkan Beranda
  if (mode === 'username') { $('lunskip').click(); return; } // akun sudah ada: cukup lewati pilih username
  close({ noFocus: true });
  try { if (window.Shell && Shell.setTab) Shell.setTab('home'); } catch {}
}
window.openLogin = n => open(n === 2 ? 2 : n === 'register' ? 'register' : 1);
window.closeLogin = () => close();
window.isLoginOpen = isOpen;

/* ---------- pindah Masuk <-> Daftar ---------- */
page.querySelectorAll('[data-go]').forEach(b => { b.onclick = () => setMode(b.dataset.go); });
$('lctareg').onclick = () => setMode('register');
$('lctalogin').onclick = () => setMode('login');
$('lback').onclick = home;

/* tombol mata (lihat/sembunyikan password) */
page.addEventListener('click', e => {
  const b = e.target.closest('.leye'); if (!b) return;
  const inp = $(b.dataset.eye), on = inp.type === 'password';
  inp.type = on ? 'text' : 'password'; b.classList.toggle('on', on);
  b.setAttribute('aria-pressed', String(on)); b.setAttribute('aria-label', on ? 'Sembunyikan password' : 'Tampilkan password');
  inp.focus();
});

/* ---------- Masuk ---------- */
f1.addEventListener('submit', async e => {
  e.preventDefault();
  const username = $('auser').value.trim(), password = $('apass').value;
  if (!username || !password) { uiLogin.set('Isi username dan password dulu.', true); return; }
  const r = await authGo('login', { username, password }, uiLogin);
  if (r) { $('apass').value = ''; if (!(r.needUsername)) close(); }
});
$('auser').addEventListener('keydown', e => { if (e.key === 'Enter' && !$('apass').value) { e.preventDefault(); $('apass').focus(); } });

/* ---------- Daftar ---------- */
f2.addEventListener('submit', async e => {
  e.preventDefault();
  const username = $('ruser').value.trim(), password = $('rpass').value, again = $('rpass2').value;
  if (!username || !password) { uiReg.set('Isi username dan password dulu.', true); return; }
  if (!USER_RE.test(username)) { uiReg.set('Username 3-20 karakter: huruf, angka, titik, strip, atau garis bawah.', true); $('ruser').focus(); return; }
  if (password.length < 6) { uiReg.set('Password minimal 6 karakter.', true); $('rpass').focus(); return; }
  if (password !== again) { uiReg.set('Password dan ulangi password belum sama.', true); $('rpass2').focus(); return; }
  const r = await authGo('register', { username, password }, uiReg);
  if (r) { $('rpass').value = ''; $('rpass2').value = ''; if (!(r.needUsername)) close(); }
});
$('ruser').addEventListener('keydown', e => { if (e.key === 'Enter' && !$('rpass').value) { e.preventDefault(); $('rpass').focus(); } });

/* ---------- username (setelah daftar lewat Google) ---------- */
const skipKey = 'unskip';
async function saveName() {
  const username = $('lun').value.trim();
  if (!username) { say('lstat2', 'Isi username dulu.', true); return; }
  f3.classList.add('sbusy'); say('lstat2', 'Menyimpan…');
  try {
    const r = await aApi('username', { username });
    store.set('gu', r.username || null);
    await initAcct();
    close();
  } catch (e) { say('lstat2', e.message, true); }
  f3.classList.remove('sbusy');
}
f3.addEventListener('submit', e => { e.preventDefault(); saveName(); });
$('lunskip').onclick = () => { try { sessionStorage.setItem(skipKey, '1'); } catch {} close(); };

/* ---------- Esc = kembali ---------- */
addEventListener('keydown', e => {
  if (e.key === 'Escape' && isOpen()) { e.preventDefault(); e.stopImmediatePropagation(); home(); }
}, true);

/* ---------- Google ---------- */
let gcid = null, gisP = null, gInit = false;
async function clientId() {
  if (gcid !== null) return gcid;
  try { gcid = (await (await fetch('/api/auth/config')).json()).google || ''; } catch { gcid = ''; return ''; }
  return gcid;
}
function loadGis() {
  return gisP ??= new Promise((res, rej) => {
    const s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.async = true;
    s.onload = res; s.onerror = () => { gisP = null; rej(new Error('gis')); };
    document.head.append(s);
  });
}
async function gisReady() {
  const id = await clientId(); if (!id) return false;
  try { await loadGis(); } catch { return false; }
  if (!window.google || !google.accounts || !google.accounts.id) return false;
  if (!gInit) { google.accounts.id.initialize({ client_id: id, callback: onCredential, use_fedcm_for_prompt: true }); gInit = true; }
  return true;
}
const dark = () => document.documentElement.dataset.theme === 'dark' || (document.documentElement.dataset.theme !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
function drawBtn(el, text) {
  el.textContent = '';
  const w = Math.max(200, Math.min(380, Math.round(el.parentElement.clientWidth || el.clientWidth || 300)));
  google.accounts.id.renderButton(el, { type: 'standard', theme: dark() ? 'filled_black' : 'outline', size: 'large', text, shape: 'pill', width: w, logo_alignment: 'left' });
}
async function paintGoogle() {
  const ok = await gisReady();
  $('lgwrap').classList.toggle('hide', !ok);
  $('rgwrap').classList.toggle('hide', !ok);
  if (ok && isOpen() && mode !== 'username') { drawBtn($('lgbtn'), 'continue_with'); drawBtn($('rgbtn'), 'signup_with'); }
}
/* Satu callback untuk dua keperluan: belum masuk (atok kosong) = login/daftar, sudah masuk = tautkan ke akun ini. */
async function onCredential(resp) {
  const credential = resp && resp.credential; if (!credential) return;
  if (typeof atok !== 'undefined' && atok) return link(credential);
  const r = await authGo('google', { credential }, uiCur());
  if (!r) return;
  if (r.needUsername) { open(2); try { sessionStorage.removeItem(skipKey); } catch {} } /* halaman sudah ditutup oleh ui.ok untuk yang tidak perlu username */
}

/* ---------- Pengaturan: hubungkan / lepas Google (akun lama) ---------- */
async function link(credential) {
  setA('Menghubungkan Google…');
  try {
    const r = await aApi('google/link', { credential });
    await initAcct();
    setA('Google (' + (r.email || 'akun') + ') terhubung. Sekarang kamu bisa masuk dengan Google ke akun ini.');
  } catch (e) { setA(e.message, true); }
}
async function paintLink() {
  const row = $('grow'); if (!row) return;
  const g = window.__gacct;
  if (!atok || !g) { row.classList.add('hide'); return; }
  const id = await clientId();
  if (!id) { row.classList.add('hide'); return; }
  row.classList.remove('hide');
  $('gtxt').textContent = g.linked ? (g.email || 'Terhubung') : 'Belum terhubung';
  $('gunl').classList.toggle('hide', !(g.linked && g.hasPassword));
  const holder = $('gbtn');
  if (g.linked) { holder.textContent = ''; return; }
  if (await gisReady() && !holder.firstChild) drawBtn(holder, 'signin_with');
}
$('gunl').onclick = async () => {
  if (!confirm('Lepas Google dari akun ini? Kamu tetap bisa masuk dengan username dan password.')) return;
  try { await aApi('google/unlink'); await initAcct(); setA('Google dilepas dari akun ini.'); } catch (e) { setA(e.message, true); }
};

/* ---------- reaksi status akun ---------- */
addEventListener('acct', () => {
  paintLink();
  const g = window.__gacct;
  if (g && g.pendingName && !isOpen()) { // login Google sebelumnya belum memilih username (mis. halaman dimuat ulang)
    let skipped = false; try { skipped = !!sessionStorage.getItem(skipKey); } catch {}
    if (!skipped) open(2);
  } else if (g && !g.pendingName && mode === 'username' && isOpen()) close();
});
})();
