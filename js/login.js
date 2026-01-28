const API_URL = 'https://script.google.com/macros/s/AKfycbxTAn49pbhFmpSonDzFB54tppRPqT47NK9-vHXDzhLj6b5X1W8zlocYnF_jMD5h1rg8/exec'; 
// ⬆️ Pastikan Deploy Web App sebagai: "Execute as Me" dan "Who has access: Anyone"

document.getElementById('loginForm').addEventListener('submit', async e => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const passkey = document.getElementById('passkey').value.trim();
  const errorMsg = document.getElementById('errorMsg');
  const btn = document.getElementById('loginBtn');

  errorMsg.textContent = '';

  if (!email || !passkey) {
    errorMsg.textContent = 'Email dan PassKey wajib diisi.';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Loading...';

  try {
    // PERBAIKAN: Menggunakan text/plain agar tidak terkena blokir CORS (Preflight)
    // Google Apps Script tetap bisa membaca body JSON.stringify
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8' 
      },
      body: JSON.stringify({
        action: 'LOGIN_KASIR',
        email,
        passkey
      })
    });

    const data = await res.json();

    if (!data.success) {
      errorMsg.textContent = data.message;
      btn.disabled = false;
      btn.textContent = 'Login';
      return;
    }

    // simpan session sederhana
    localStorage.setItem('kasirNama', data.nama);
    localStorage.setItem('kasirNo', data.nomor);
	localStorage.setItem('user_email', email); 

    window.location.href = data.redirect;

  } catch (err) {
    console.error(err); // Log error ke console untuk debugging
    errorMsg.textContent = 'Gagal koneksi ke server. Cek internet atau URL API.';
    btn.disabled = false;
    btn.textContent = 'Login';
  }
});
