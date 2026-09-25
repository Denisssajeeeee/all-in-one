const platforms = document.querySelectorAll('#platforms button');
let selected = 'auto';
platforms.forEach(btn=>{
  btn.addEventListener('click',()=>{
    platforms.forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    selected = btn.dataset.p;
  });
});

function detectPlatform(url){
  if(/instagram\.com/i.test(url)) return 'ig';
  if(/tiktok\.com/i.test(url)) return 'tt';
  if(/facebook\.com|fb\.watch/i.test(url)) return 'fb';
  if(/youtube\.com|youtu\.be/i.test(url)) return 'yt';
  return null;
}

const names = {ig:'Instagram', tt:'TikTok', fb:'Facebook', yt:'YouTube'};
const icons = {ig:'📸', tt:'🎵', fb:'👥', yt:'▶️'};

// Terhubung ke API all-in-one downloader nexadev.
const API_BASE = 'https://api.nexadev.my.id/api/aio';
const API_KEY  = 'DennnCodee';

async function tryFetchJson(url){
  try{
    const res = await fetch(url);
    return await res.json();
  }catch(e){
    return null;
  }
}

async function fetchDownloadLinks(url, platform){
  const endpoint = API_BASE + '?url=' + encodeURIComponent(url) + '&apikey=' + encodeURIComponent(API_KEY);

  // 1) Coba langsung dari browser
  let data = await tryFetchJson(endpoint);

  // 2) Kalau diblokir CORS, coba lewat proxy publik (hanya untuk uji coba, bukan solusi permanen)
  if(!data){
    const proxied = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(endpoint);
    data = await tryFetchJson(proxied);
  }

  if(!data){
    throw new Error('Tidak bisa menghubungi API sama sekali, baik langsung maupun lewat proxy cadangan. Server API mungkin sedang down.');
  }

  const payload = data && (data.result || data.data);
  if(!payload){
    throw new Error((data && data.msg) || 'Video tidak ditemukan, link privat, atau API gagal memprosesnya.');
  }

  const downloadUrl =
    payload.download || payload.url || payload.video ||
    payload.hd || payload.nowm || payload.play ||
    (Array.isArray(payload.urls) && payload.urls[0]) ||
    (Array.isArray(payload.data) && payload.data[0] && (payload.data[0].url || payload.data[0].download));

  if(!downloadUrl){
    console.log('Respons API (format tidak dikenali):', data);
    throw new Error('API merespons tapi field link unduhannya tidak dikenali. Buka console untuk lihat respons mentah.');
  }

  return {
    title: payload.title || payload.caption || payload.desc || 'Video ditemukan',
    quality: payload.quality || payload.resolution || 'HD',
    downloadUrl
  };
}

const input = document.getElementById('urlInput');
const goBtn = document.getElementById('goBtn');
const status = document.getElementById('status');
const result = document.getElementById('result');

goBtn.addEventListener('click', async ()=>{
  const url = input.value.trim();
  status.className='status'; status.textContent='';
  result.classList.remove('show');

  if(!url){ status.className='status error'; status.textContent='Tempel link video terlebih dahulu.'; return; }

  const platform = selected==='auto' ? detectPlatform(url) : selected;
  if(!platform){ status.className='status error'; status.textContent='Link tidak dikenali. Pilih platform secara manual.'; return; }

  goBtn.disabled = true;
  status.className='status'; status.textContent = 'Memproses link dari '+names[platform]+'…';

  try{
    const data = await fetchDownloadLinks(url, platform);
    document.getElementById('thumbIcon').textContent = icons[platform];
    document.getElementById('resTitle').textContent = data.title || 'Video ditemukan';
    document.getElementById('resSub').textContent = (names[platform])+' · '+(data.quality||'HD');
    document.getElementById('dlBtn').onclick = ()=> window.open(data.downloadUrl,'_blank');
    result.classList.add('show');
    status.className='status ok'; status.textContent='Siap diunduh.';
  }catch(err){
    status.className='status error';
    status.textContent = err.message;
  }finally{
    goBtn.disabled = false;
  }
});

input.addEventListener('keydown', e=>{ if(e.key==='Enter') goBtn.click(); });
