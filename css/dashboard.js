const dataDummy = [
  { no: '260112001', nama: 'Hadiman' },
  { no: '260112002', nama: 'Chris' },
  { no: '260112003', nama: 'Asep' }
];

const body = document.getElementById('antrianBody');

dataDummy.forEach(item => {
  // baris utama
  const trMain = document.createElement('tr');
  trMain.className = 'row-main';
  trMain.innerHTML = `
    <td>${item.no}</td>
    <td>${item.nama}</td>
  `;

  // baris detail (hidden)
  const trDetail = document.createElement('tr');
  trDetail.className = 'row-detail';
  trDetail.innerHTML = `
    <td colspan="2">
      <div class="detail-box">
        <select>
          <option value="">-- Pilih Kondisi --</option>
          <option>dikerjakan</option>
          <option>data tidak naik</option>
          <option>dokumen tidak lengkap</option>
          <option>konfirmasi</option>
          <option>uang palsu</option>
        </select>

        <button class="btn btn-call">PANGGIL</button>
        <button class="btn btn-doc">DOKUMEN SESUAI</button>
      </div>
    </td>
  `;

  // toggle buka / tutup
  trMain.addEventListener('click', () => {
    trDetail.style.display =
      trDetail.style.display === 'table-row' ? 'none' : 'table-row';
  });

  body.appendChild(trMain);
  body.appendChild(trDetail);
});
