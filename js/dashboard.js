const API_URL = 'https://script.google.com/macros/s/AKfycbxA4XRXMrlI3Ft1NjTd4qp0kKIhctkyJ38qG3bKMbPEWzb0cRqII24hB88WzWVX0cr6/exec';
const body = document.getElementById('antrianBody');
const btnFinish = document.getElementById('btnFinishDay');

// ==========================================
// 1. JAM & TANGGAL REALTIME
// ==========================================
function updateDateTime() {
  const now = new Date();
  const optionsDate = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  const dateStr = now.toLocaleDateString('id-ID', optionsDate);
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  
  // Cari elemen header subtitle atau buat baru jika belum ada
  let dateTimeEl = document.getElementById('liveDateTime');
  if (!dateTimeEl) {
    const header = document.querySelector('.header h2');
    dateTimeEl = document.createElement('div');
    dateTimeEl.id = 'liveDateTime';
    dateTimeEl.style.fontSize = '0.9rem';
    dateTimeEl.style.color = '#64748b';
    dateTimeEl.style.marginTop = '5px';
    header.parentNode.insertBefore(dateTimeEl, header.nextSibling);
  }
  
  dateTimeEl.innerHTML = `📅 ${dateStr} &nbsp; ⏰ ${timeStr}`;
}
// Update jam setiap detik
setInterval(updateDateTime, 1000);
updateDateTime(); // Jalankan langsung saat load

// ==========================================
// 2. LOGIK TOMBOL SELESAI HARI INI
// ==========================================
// Ganti bagian btnFinish.addEventListener kamu dengan ini:
if (btnFinish) {
  btnFinish.addEventListener('click', async () => {
    
    // 1. Konfirmasi User
    const yakin = confirm("Yakin ingin menutup hari ini? \nLaporan akan dikirim ke Email & WhatsApp Admin.");
    if (!yakin) return;

    // 2. Ambil Email
    const userEmail = localStorage.getItem('user_email') || 'Unknown User';

    // 3. UI Loading
    const originalText = btnFinish.innerText;
    btnFinish.innerText = "⏳ Mengirim...";
    btnFinish.disabled = true;
    btnFinish.style.opacity = "0.7";

    try {
      // 4. Kirim Request
      const response = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({ 
            action: 'FINISH_DAY',
            actor: userEmail 
        }) 
      });

      // 5. Baca Text Dulu (Untuk Debugging jika JSON error)
      const textResult = await response.text();
      let result;

      try {
        result = JSON.parse(textResult);
      } catch (e) {
        console.error("Server tidak mengembalikan JSON valid:", textResult);
        // Jika textResult kosong tapi status 200, anggap sukses
        if(response.ok) {
            result = { success: true, message: "Laporan terkirim (Respon server non-JSON)" };
        } else {
            throw new Error("Respon server error: " + textResult.substring(0, 50));
        }
      }

      // 6. Cek Sukses
      if (result.success) {
		  alert("✅ " + (result.message || "Laporan Harian Berhasil Dikirim!"));

		  // ⏳ kasih delay dikit biar user sadar dia ke-logout
		  setTimeout(() => {
			logoutUser();
		  }, 800);
	  } else {
        alert("❌ Gagal: " + (result.message || "Terjadi kesalahan server"));
      }

    } catch (error) {
      console.error("Error Finish Day:", error);
      // Cek apakah error karena timeout tapi sebenernya backend jalan
      alert("⚠️ Terjadi gangguan koneksi, tapi kemungkinan email sudah terkirim. Silakan cek email Admin.");
    } finally {
      // 7. Reset Tombol
      btnFinish.innerText = originalText;
      btnFinish.disabled = false;
      btnFinish.style.opacity = "1";
    }
  });
}

// ==========================================
// 3. LOAD DATA (SMOOTH REFRESH)
// ==========================================
async function loadData(isBackgroundRefresh = false) {
  // Hanya tampilkan "Memuat data..." jika ini load pertama kali (tabel masih kosong)
  if (!isBackgroundRefresh && body.children.length === 0) {
     body.innerHTML = '<tr><td colspan="2" style="text-align:center; padding: 20px;">Memuat data...</td></tr>';
  }

  try {
    const response = await fetch(`${API_URL}?action=getAntrian`);
    const data = await response.json();
    renderTable(data);
  } catch (error) {
    console.error("Gagal refresh data:", error);
    // Kalau background refresh error, jangan hapus tabel lama, biarkan saja data terakhir.
    // Hanya tampilkan error kalau tabel benar-benar kosong
    if (body.children.length === 0) {
        body.innerHTML = '<tr><td colspan="2" style="text-align:center; color:red; padding:20px;">Gagal koneksi. Refresh halaman.</td></tr>';
    }
  }
}

// ==========================================
// 4. RENDER TABLE & LOGIC LAIN
// ==========================================

function renderTable(dataList) {
  const activeRow = document.querySelector('.row-main.active');
  const activeId = activeRow ? activeRow.querySelector('.col-left div').innerText : null;

  body.innerHTML = ''; 

  if(dataList.length === 0) {
     body.innerHTML = '<tr><td colspan="2" style="text-align:center; padding:20px;">Belum ada antrian.</td></tr>';
     return;
  }

  dataList.forEach(item => {
    const trMain = document.createElement('tr');
    trMain.className = 'row-main';
    const selectId = `status-${item.no}`;

    if (item.status === 'SELESAI') {
      trMain.classList.add('completed');
    }

    let isRowActive = (item.no === activeId);
    if (isRowActive) {
        trMain.classList.add('active');
    }

    // Bagian Main Row
    trMain.innerHTML = `
      <td class="col-left">
        <div>${item.no}</div>
        <div style="font-size:1.1em; font-weight:bold">${item.nama}</div>
        <div style="font-size:0.8em; margin-top:5px; color:${item.status === 'SELESAI' ? 'green' : '#666'}">
          Status: ${item.status}
        </div>
      </td>
      <td class="col-right">
        <div class="action-area"> 
          <select id="${selectId}" class="status-select" onclick="event.stopPropagation()">
            <option value="${item.status}" selected hidden>${item.status}</option>
            <option value="ADA UANG PALSU">Ada uang Palsu</option>
            <option value="DATA TIDAK NAIK">Data Tidak Naik</option>
            <option value="DOKUMEN TIDAK LENGKAP">Dokumen Tidak Lengkap</option>
            <option value="SELESAI">SELESAI</option>
          </select>
          <button class="btn btn-call" onclick="handlePanggil('${item.no}', '${item.nama}')">PANGGIL</button>
          <button class="btn btn-doc" onclick="handleSelesai('${item.no}')">DOKUMEN SESUAI</button>
        </div>
      </td>
    `;

    // Bagian Detail Row
    const trDetail = document.createElement('tr');
    trDetail.className = 'row-detail';
    
    trDetail.style.display = isRowActive ? 'table-row' : 'none';
    
    trDetail.innerHTML = `
      <td colspan="2">
        <div class="detail-data">
          <div class="box"><span>Tunai</span><div class="value">${formatRupiah(item.cash)}</div></div>
          <div class="box"><span>CRM</span><div class="value">${formatRupiah(item.crm)}</div></div>
          <div class="box"><span>Non Tunai</span><div class="value">${formatRupiah(item.deposit)}</div></div>
          <div class="box"><span>Promo Cash</span><div class="value">${formatRupiah(item.promoCash)}</div></div>
          <div class="box"><span>Promo Credit</span><div class="value">${formatRupiah(item.promoCredit)}</div></div>
          
          <div class="box" style="background-color: #f0fdf4;"><span>Toko Transfer</span><div class="value">${formatRupiah(item.tokoTransfer)}</div></div>
          <div class="box" style="background-color: #fff7ed;"><span>Giro</span><div class="value">${formatRupiah(item.giro)}</div></div>
          <div class="box total-box"><span>Total</span><div class="value">${formatRupiah(item.total)}</div></div>
        </div>
      </td>
    `;

    trMain.addEventListener('click', (e) => {
      if (e.target.closest('.action-area')) return;
      
      const isOpen = trMain.classList.contains('active');
      
      document.querySelectorAll('.row-main').forEach(r => r.classList.remove('active'));
      document.querySelectorAll('.row-detail').forEach(r => r.style.display = 'none');

      if (!isOpen) {
        trMain.classList.add('active');
        trDetail.style.display = 'table-row';
        
        const currentSelect = document.getElementById(selectId);
        if (item.status === 'MENUNGGU') {
            currentSelect.value = 'DIPROSES'; 
            trMain.querySelector('.col-left div:last-child').innerHTML = 'Status: DIPROSES';
            kirimUpdateStatus(item.no, 'DIPROSES', 'Auto-update saat view detail');
        }
      }
    });

    body.appendChild(trMain);
    body.appendChild(trDetail);
  });
}

function handlePanggil(noAntri, nama) {
    const selectEl = document.getElementById(`status-${noAntri}`);
    const statusDipilih = selectEl.value;
    alert(`Memanggil ${nama}...\nStatus: ${statusDipilih}`);
    kirimUpdateStatus(noAntri, statusDipilih, `Panggilan Manual: ${statusDipilih}`);
}

function handleSelesai(noAntri) {
    if(confirm('Yakin dokumen sudah sesuai? Status akan jadi SELESAI.')) {
        const row = document.getElementById(`status-${noAntri}`).closest('tr');
        row.classList.add('completed');
        
        // Ubah teks status jadi hijau juga
        const statusText = row.querySelector('.col-left div:last-child');
        if(statusText) {
            statusText.innerText = 'Status: SELESAI';
            statusText.style.color = 'green';
        }

        kirimUpdateStatus(noAntri, 'SELESAI', 'Tombol Dokumen Sesuai');
        
        // Refresh cepat biar data sinkron
        setTimeout(() => loadData(true), 1000); 
    }
}

function kirimUpdateStatus(no, status, logMsg) {
    const userEmail = localStorage.getItem('user_email') || 'Unknown User';

    fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({
            action: 'UPDATE_STATUS',
            no: no,
            status: status,
            keterangan: logMsg,
            actor: userEmail 
        })
    })
    .then(res => res.json())
    .then(result => console.log('Update Sukses:', result))
    .catch(err => console.error('Gagal update status:', err));
}

function formatRupiah(angka) {
    return new Intl.NumberFormat('id-ID').format(angka || 0);
}

// Load pertama kali (tampilkan loading teks)
loadData(false);

// Auto refresh setiap 150 detik (background, tanpa loading teks)
setInterval(() => loadData(true), 150000);


function logoutUser() {
  // Hapus data login
  localStorage.removeItem('user_email');
  localStorage.removeItem('user_name'); // kalau ada
  localStorage.removeItem('token');     // kalau ada

  // Redirect ke halaman login
  window.location.href = 'login.html';
}
