const poster = document.getElementById('poster');
const wrap = document.getElementById('wrap');
const W = 1080, H = 1720;

// Adapte l'affiche à la largeur de l'écran (Android, iOS, ordinateur)
function fit() {
  const s = Math.min(1, wrap.clientWidth / W);
  poster.style.transform = 'scale(' + s + ')';
  wrap.style.height = (H * s) + 'px';
}
addEventListener('resize', fit);
addEventListener('orientationchange', fit);
fit();

// Photo de l'utilisateur
document.getElementById('f').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const r = new FileReader();
  r.onload = () => {
    const img = document.getElementById('img');
    const photoArea = document.getElementById('me');
    img.onload = () => {
      const scale = Math.max(photoArea.clientWidth / img.naturalWidth, photoArea.clientHeight / img.naturalHeight);
      const width = img.naturalWidth * scale;
      const height = img.naturalHeight * scale;
      img.style.width = width + 'px';
      img.style.height = height + 'px';
      img.style.left = (photoArea.clientWidth - width) / 2 + 'px';
      img.style.top = (photoArea.clientHeight - height) / 2 + 'px';
      img.style.display = 'block';
      document.getElementById('ph').style.display = 'none';
      document.getElementById('actions').hidden = false;
      document.getElementById('share-status').textContent = '';
      document.getElementById('whatsapp-fallback').hidden = true;
    };
    img.onerror = () => {
      document.getElementById('share-status').textContent = 'Cette photo ne peut pas être affichée. Choisis un autre fichier image.';
      document.getElementById('actions').hidden = false;
    };
    img.src = r.result;
  };
  r.readAsDataURL(file);
});

// Nom : sélection automatique au toucher, pas de retour à la ligne
const nm = document.getElementById('nm');
nm.addEventListener('focus', () => {
  if (nm.textContent.trim() === 'Votre nom') {
    const range = document.createRange();
    range.selectNodeContents(nm);
    const sel = getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }
});
nm.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); nm.blur(); } });

const downloadButton = document.getElementById('download');
const shareButton = document.getElementById('share');
const shareStatus = document.getElementById('share-status');
const whatsappFallback = document.getElementById('whatsapp-fallback');
const shareMessage = 'J’y serai au Méga Hadra du 11 et au Gamou du 12 décembre, incha Allah !';

async function createPosterBlob() {
  if (!window.html2canvas) throw new Error('La création d’image est indisponible. Vérifie ta connexion Internet.');

  const previousTransform = poster.style.transform;
  const previousHeight = wrap.style.height;
  poster.style.transform = 'none';
  wrap.style.height = H + 'px';

  try {
    const canvas = await html2canvas(poster, {
      scale: 1,
      useCORS: true,
      width: W,
      height: H,
      windowWidth: W
    });
    return await new Promise((resolve, reject) => {
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Création de l’image impossible.')), 'image/png');
    });
  } finally {
    poster.style.transform = previousTransform;
    wrap.style.height = previousHeight;
  }
}

function downloadBlob(blob) {
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = 'jyserai-gamou-ouakam.png';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function setButtonsBusy(busy) {
  downloadButton.disabled = busy;
  shareButton.disabled = busy;
  downloadButton.textContent = busy ? 'Préparation…' : 'Télécharger l’affiche';
  shareButton.textContent = busy ? 'Préparation…' : 'Partager l’affiche';
}

downloadButton.addEventListener('click', async () => {
  setButtonsBusy(true);
  shareStatus.textContent = '';
  try {
    downloadBlob(await createPosterBlob());
    shareStatus.textContent = 'L’affiche a été téléchargée.';
  } catch (error) {
    shareStatus.textContent = error.message || 'Impossible de créer l’affiche.';
  } finally {
    setButtonsBusy(false);
  }
});

shareButton.addEventListener('click', async () => {
  setButtonsBusy(true);
  shareStatus.textContent = '';
  whatsappFallback.hidden = true;
  try {
    const blob = await createPosterBlob();
    const file = new File([blob], 'jyserai-gamou-ouakam.png', { type: 'image/png' });

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: 'J’y serai – Gamou Ouakam',
        text: shareMessage
      });
      return;
    }

    downloadBlob(blob);
    whatsappFallback.href = 'https://wa.me/?text=' + encodeURIComponent(shareMessage);
    whatsappFallback.hidden = false;
    shareStatus.textContent = 'L’affiche est téléchargée. Ouvre WhatsApp et joins l’image au message.';
  } catch (error) {
    if (error.name !== 'AbortError') shareStatus.textContent = error.message || 'Impossible de partager l’affiche.';
  } finally {
    setButtonsBusy(false);
  }
});

