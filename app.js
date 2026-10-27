'use strict';

const STORAGE_KEY = 'comunicalibre.web.v1';
const CATEGORY_LABELS = {
  basicas: 'Básicas',
  necesidades: 'Necesidades',
  salud: 'Salud',
  familia: 'Familia',
  emergencia: 'Emergencia'
};
const CATEGORY_ICONS = {
  basicas: '✅', necesidades: '♡', salud: '✚', familia: '⌂', emergencia: '⚠'
};
const CATEGORY_SUBTITLES = {
  basicas: 'Una respuesta rápida', necesidades: 'Expresá lo que necesitás', salud: 'Contá cómo te sentís', familia: 'Comunicáte con los tuyos', emergencia: 'Frase importante'
};
const DEFAULT_PHRASES = [
  { id: 'base-si', text: 'Sí', category: 'basicas', emoji: '✅', subtitle: 'Afirmación', emergency: false },
  { id: 'base-no', text: 'No', category: 'basicas', emoji: '✋', subtitle: 'Negación', emergency: false },
  { id: 'base-no-se', text: 'No sé', category: 'basicas', emoji: '🤔', subtitle: 'Necesito pensarlo', emergency: false },
  { id: 'base-gracias', text: 'Gracias', category: 'basicas', emoji: '💙', subtitle: 'Agradecimiento', emergency: false },
  { id: 'base-por-favor', text: 'Por favor', category: 'basicas', emoji: '🙏', subtitle: 'Una petición', emergency: false },
  { id: 'base-espera', text: 'Esperá un momento', category: 'basicas', emoji: '⏳', subtitle: 'Necesito un momento', emergency: false },
  { id: 'need-agua', text: 'Tengo sed', category: 'necesidades', emoji: '💧', subtitle: 'Quiero tomar algo', emergency: false },
  { id: 'need-comida', text: 'Tengo hambre', category: 'necesidades', emoji: '🍽️', subtitle: 'Quiero comer', emergency: false },
  { id: 'need-frio', text: 'Tengo frío', category: 'necesidades', emoji: '❄️', subtitle: 'Necesito abrigo', emergency: false },
  { id: 'need-calor', text: 'Tengo calor', category: 'necesidades', emoji: '☀️', subtitle: 'Necesito refrescarme', emergency: false },
  { id: 'need-bano', text: 'Quiero ir al baño', category: 'necesidades', emoji: '🚻', subtitle: 'Necesito ir al baño', emergency: false },
  { id: 'need-posicion', text: 'Quiero cambiar de posición', category: 'necesidades', emoji: '🛏️', subtitle: 'Necesito acomodarme', emergency: false },
  { id: 'salud-dolor', text: 'Tengo dolor', category: 'salud', emoji: '🩹', subtitle: 'Algo me duele', emergency: false },
  { id: 'salud-medico', text: 'Llamá a un médico', category: 'salud', emoji: '🩺', subtitle: 'Necesito atención médica', emergency: true },
  { id: 'salud-medicacion', text: 'Necesito mi medicación', category: 'salud', emoji: '💊', subtitle: 'Necesito mi medicación', emergency: false },
  { id: 'salud-cansado', text: 'Estoy cansado/a', category: 'salud', emoji: '😴', subtitle: 'Necesito descansar', emergency: false },
  { id: 'familia-ayuda', text: 'Llamá a mi familia', category: 'familia', emoji: '📞', subtitle: 'Quiero hablar con alguien cercano', emergency: false },
  { id: 'familia-acompaname', text: 'Quedate conmigo', category: 'familia', emoji: '🤝', subtitle: 'Necesito compañía', emergency: false },
  { id: 'familia-quiero-hablar', text: 'Quiero hablar', category: 'familia', emoji: '💬', subtitle: 'Tengo algo para decir', emergency: false },
  { id: 'base-estoy-bien', text: 'Estoy bien', category: 'basicas', emoji: '😊', subtitle: 'Todo está bien', emergency: false },
  { id: 'emergencia-ayuda', text: 'Necesito ayuda', category: 'emergencia', emoji: '🆘', subtitle: 'Necesito que vengas', emergency: true },
  { id: 'emergencia-urgente', text: 'Es una emergencia', category: 'emergencia', emoji: '🚨', subtitle: 'Necesito ayuda urgente', emergency: true },
  { id: 'emergencia-aire', text: 'Me cuesta respirar', category: 'emergencia', emoji: '🫁', subtitle: 'Necesito ayuda inmediata', emergency: true },
  { id: 'emergencia-mover', text: 'No me muevas, por favor', category: 'emergencia', emoji: '✋', subtitle: 'Necesito que esperes', emergency: true }
];

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
let currentView = 'all';
let searchQuery = '';
let scannerTimer = null;
let scanIndex = 0;
let toastTimer = null;
let currentUtterance = null;

function defaultSettings() {
  return { rate: 0.85, voiceURI: '', historyEnabled: true, profileName: 'Usuario principal', lastMessage: '' };
}
function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!parsed || typeof parsed !== 'object') throw new Error('No stored state');
    return {
      customPhrases: Array.isArray(parsed.customPhrases) ? parsed.customPhrases.filter(p => p && typeof p.text === 'string' && p.id && CATEGORY_LABELS[p.category]) : [],
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites.filter(id => typeof id === 'string') : [],
      history: Array.isArray(parsed.history) ? parsed.history.filter(item => item && typeof item.text === 'string').slice(0, 30) : [],
      settings: { ...defaultSettings(), ...(parsed.settings || {}) }
    };
  } catch {
    return { customPhrases: [], favorites: [], history: [], settings: defaultSettings() };
  }
}
const state = loadState();
function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ customPhrases: state.customPhrases, favorites: state.favorites, history: state.history, settings: state.settings }));
  } catch {
    showToast('El navegador no pudo guardar los cambios. Revisá el espacio disponible o los permisos.');
  }
}
function allPhrases() { return [...DEFAULT_PHRASES, ...state.customPhrases]; }
function getPhrase(id) { return allPhrases().find(p => p.id === id); }
function escapeHTML(value) {
  return String(value).replace(/[&<>'"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch]));
}
function categoryLabel(category) { return CATEGORY_LABELS[category] || 'Personalizadas'; }
function categoryEmoji(category) { return CATEGORY_ICONS[category] || '💬'; }
function phraseEmoji(phrase) { return phrase.emoji || categoryEmoji(phrase.category); }
function phraseSubtitle(phrase) { return phrase.subtitle || CATEGORY_SUBTITLES[phrase.category] || 'Tu frase personalizada'; }
function getVisiblePhrases() {
  let phrases = allPhrases();
  if (currentView === 'favoritas') phrases = phrases.filter(p => state.favorites.includes(p.id));
  else if (currentView === 'personalizadas') phrases = phrases.filter(p => state.customPhrases.some(c => c.id === p.id));
  else if (currentView === 'emergencia') phrases = phrases.filter(p => p.emergency || p.category === 'emergencia');
  else if (currentView !== 'all') phrases = phrases.filter(p => p.category === currentView);
  if (searchQuery) {
    const q = searchQuery.toLocaleLowerCase('es');
    phrases = phrases.filter(p => `${p.text} ${categoryLabel(p.category)} ${phraseSubtitle(p)}`.toLocaleLowerCase('es').includes(q));
  }
  return phrases;
}
function updateCounts() {
  $('#allCount').textContent = allPhrases().length;
  $('#customCount').textContent = state.customPhrases.length;
  $('#favoriteCount').textContent = state.favorites.filter(id => allPhrases().some(p => p.id === id)).length;
}
function updateViewHeading() {
  const headings = {
    all: ['¿Qué querés comunicar?', 'Elegí una frase para decirla en voz alta o escribí tu propio mensaje.'],
    basicas: ['Frases básicas', 'Respuestas y expresiones para comunicarte rápidamente.'],
    necesidades: ['Mis necesidades', 'Contá qué necesitás en este momento.'],
    salud: ['Salud y bienestar', 'Frases para explicar cómo te sentís y qué necesitás.'],
    familia: ['Familia y compañía', 'Mensajes para comunicarte con quienes te acompañan.'],
    emergencia: ['Frases de emergencia', 'Acceso directo a mensajes importantes.'],
    personalizadas: ['Mis frases', 'Tus frases personales, adaptadas a tu forma de comunicarte.'],
    favoritas: ['Mis favoritas', 'Tené a mano las frases que usás con más frecuencia.']
  };
  const [title, description] = headings[currentView] || headings.all;
  $('#viewTitle').textContent = title;
  $('#viewDescription').textContent = description;
  $('#phraseSectionTitle').textContent = currentView === 'all' ? 'Frases disponibles' : title;
  $$('#categoryNav [data-view]').forEach(button => {
    const active = button.dataset.view === currentView;
    button.classList.toggle('active', active);
    if (active) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
}
function renderPhrases() {
  const phrases = getVisiblePhrases();
  $('#phraseCountText').textContent = `${phrases.length} ${phrases.length === 1 ? 'frase disponible' : 'frases disponibles'} · Tocá una tarjeta para escucharla.`;
  $('#phraseGrid').innerHTML = phrases.map((phrase, index) => {
    const isFavorite = state.favorites.includes(phrase.id);
    const isCustom = state.customPhrases.some(p => p.id === phrase.id);
    const emergencyClass = phrase.emergency || phrase.category === 'emergencia' ? ' emergency-card' : '';
    const tag = phrase.emergency ? 'EMERGENCIA' : categoryLabel(phrase.category).toLocaleUpperCase('es');
    return `<article class="phrase-card${emergencyClass}" data-category="${escapeHTML(phrase.category)}" data-phrase-id="${escapeHTML(phrase.id)}">
      <button class="phrase-speak" type="button" data-speak-id="${escapeHTML(phrase.id)}" aria-label="Decir: ${escapeHTML(phrase.text)}">
        <span class="phrase-topline"><span class="phrase-emoji" aria-hidden="true">${escapeHTML(phraseEmoji(phrase))}</span><span class="phrase-tag">${escapeHTML(tag)}</span></span>
        <span class="phrase-text">${escapeHTML(phrase.text)}</span><span class="phrase-subtitle">${escapeHTML(phraseSubtitle(phrase))}</span>
      </button>
      <div class="phrase-card-footer"><span class="hint"><span class="speak-glyph" aria-hidden="true">▶</span> Decir frase</span><div class="phrase-tools">
        <button class="mini-action${isFavorite ? ' fav-active' : ''}" type="button" data-favorite-id="${escapeHTML(phrase.id)}" aria-label="${isFavorite ? 'Quitar de favoritas' : 'Agregar a favoritas'}: ${escapeHTML(phrase.text)}" aria-pressed="${isFavorite}" title="${isFavorite ? 'Quitar de favoritas' : 'Agregar a favoritas'}">${isFavorite ? '★' : '☆'}</button>
        ${isCustom ? `<button class="mini-action" type="button" data-edit-id="${escapeHTML(phrase.id)}" aria-label="Editar frase: ${escapeHTML(phrase.text)}" title="Editar frase">✎</button><button class="mini-action delete-action" type="button" data-delete-id="${escapeHTML(phrase.id)}" aria-label="Eliminar frase: ${escapeHTML(phrase.text)}" title="Eliminar frase">×</button>` : ''}
      </div></div></article>`;
  }).join('');
  $('#phraseGrid').hidden = phrases.length === 0;
  $('#emptyState').hidden = phrases.length !== 0;
  if (state.settings.scanEnabled) updateScannerTargets();
}
function renderHistory() {
  const disabled = !state.settings.historyEnabled;
  $('#historyList').hidden = disabled;
  $('#historyDisabled').hidden = !disabled;
  $('#clearHistoryButton').hidden = disabled || state.history.length === 0;
  if (disabled) return;
  if (!state.history.length) {
    $('#historyList').innerHTML = '<div class="history-empty">Todavía no hay mensajes. Cuando digas una frase, aparecerá acá.</div>';
    return;
  }
  $('#historyList').innerHTML = state.history.slice(0, 6).map((item, index) => `<div class="history-item"><span class="history-item-icon" aria-hidden="true">↗</span><span class="history-item-text">${escapeHTML(item.text)}</span><time class="history-time" datetime="${escapeHTML(item.iso || '')}">${escapeHTML(formatDate(item.time))}</time><button class="history-repeat" type="button" data-history-index="${index}" aria-label="Repetir mensaje: ${escapeHTML(item.text)}" title="Repetir mensaje">▶</button></div>`).join('');
}
function formatDate(timestamp) {
  const date = timestamp ? new Date(timestamp) : new Date();
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }).format(date);
}
function renderAll() {
  updateViewHeading();
  updateCounts();
  renderPhrases();
  renderHistory();
  $('#profileName').textContent = state.settings.profileName || 'Usuario principal';
  $('#characterCount').textContent = `${$('#customMessage').value.length} / 500 caracteres`;
}
function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 3200);
}
function setVoiceStatus(message, type = 'ready') {
  const status = $('#voiceStatus');
  status.classList.toggle('speaking', type === 'speaking');
  status.classList.toggle('error', type === 'error');
  $('#voiceStatusText').textContent = message;
}
function recordMessage(text) {
  state.settings.lastMessage = text;
  if (state.settings.historyEnabled) {
    state.history.unshift({ text, time: Date.now(), iso: new Date().toISOString() });
    state.history = state.history.slice(0, 30);
  }
  saveState();
  renderHistory();
}
function speakText(rawText, options = {}) {
  const text = String(rawText || '').trim();
  if (!text) { showToast('Primero escribí o elegí un mensaje.'); return; }
  if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
    setVoiceStatus('Voz no disponible', 'error');
    showToast('Este navegador no ofrece lectura en voz alta. Probá con una versión actualizada de Chrome, Edge o Safari.');
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  const desiredVoiceURI = options.voiceURI !== undefined ? options.voiceURI : state.settings.voiceURI;
  const selectedVoice = voices.find(voice => voice.voiceURI === desiredVoiceURI)
    || voices.find(voice => /^es-AR$/i.test(voice.lang))
    || voices.find(voice => /^es(-|$)/i.test(voice.lang));
  if (selectedVoice) { utterance.voice = selectedVoice; utterance.lang = selectedVoice.lang; }
  else { utterance.lang = 'es-AR'; }
  utterance.rate = Number(options.rate !== undefined ? options.rate : state.settings.rate) || 0.85;
  utterance.pitch = 1;
  utterance.onstart = () => setVoiceStatus('Reproduciendo voz…', 'speaking');
  utterance.onend = () => { setVoiceStatus('Voz lista para usar', 'ready'); currentUtterance = null; };
  utterance.onerror = (event) => {
    currentUtterance = null;
    if (event.error !== 'canceled' && event.error !== 'interrupted') {
      setVoiceStatus('No se pudo reproducir', 'error');
      showToast('No se pudo reproducir la voz. Revisá el volumen y las voces del dispositivo.');
    } else setVoiceStatus('Voz lista para usar', 'ready');
  };
  currentUtterance = utterance;
  if (options.record !== false) recordMessage(text);
  try { window.speechSynthesis.speak(utterance); }
  catch { setVoiceStatus('Voz no disponible', 'error'); showToast('No fue posible iniciar la voz en este dispositivo.'); }
}
function stopSpeech() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  currentUtterance = null;
  setVoiceStatus('Voz lista para usar', 'ready');
}
function openDialog(id) {
  const dialog = document.getElementById(id);
  if (dialog && typeof dialog.showModal === 'function') dialog.showModal();
  else if (dialog) dialog.setAttribute('open', '');
}
function closeDialog(id) {
  const dialog = document.getElementById(id);
  if (!dialog) return;
  if (typeof dialog.close === 'function') dialog.close();
  else dialog.removeAttribute('open');
}
function openPhraseDialog(phrase = null) {
  $('#phraseForm').reset();
  $('#phraseId').value = phrase ? phrase.id : '';
  $('#phraseText').value = phrase ? phrase.text : '';
  $('#phraseCategory').value = phrase ? phrase.category : 'basicas';
  $('#phraseEmergency').checked = phrase ? Boolean(phrase.emergency) : false;
  $('#phraseDialogTitle').textContent = phrase ? 'Editar frase' : 'Crear una frase';
  openDialog('phraseDialog');
  setTimeout(() => $('#phraseText').focus(), 50);
}
function refreshVoiceOptions() {
  if (!('speechSynthesis' in window)) return;
  const voiceSelect = $('#voiceSelect');
  const previous = state.settings.voiceURI || voiceSelect.value;
  const voices = window.speechSynthesis.getVoices().filter(voice => /^es(-|$)/i.test(voice.lang));
  voiceSelect.innerHTML = '<option value="">Voz en español predeterminada</option>';
  voices.forEach(voice => {
    const option = document.createElement('option');
    option.value = voice.voiceURI;
    option.textContent = `${voice.name} (${voice.lang})${voice.default ? ' · predeterminada' : ''}`;
    voiceSelect.appendChild(option);
  });
  if (voices.some(voice => voice.voiceURI === previous)) voiceSelect.value = previous;
  else voiceSelect.value = '';
}
function openSettings() {
  $('#speechRate').value = state.settings.rate;
  $('#speechRateValue').textContent = `${Number(state.settings.rate).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}×`;
  $('#historyEnabled').checked = state.settings.historyEnabled;
  refreshVoiceOptions();
  openDialog('settingsDialog');
}
function updateScannerTargets() {
  const buttons = $$('.phrase-speak', $('#phraseGrid'));
  buttons.forEach(button => { button.classList.remove('scan-target'); button.removeAttribute('aria-current'); });
  if (!state.settings.scanEnabled || !buttons.length) {
    $('#scannerNoticeText').textContent = 'Modo barrido activo.';
    return;
  }
  scanIndex = ((scanIndex % buttons.length) + buttons.length) % buttons.length;
  const target = buttons[scanIndex];
  target.classList.add('scan-target');
  target.setAttribute('aria-current', 'true');
  const phrase = getPhrase(target.closest('[data-phrase-id]')?.dataset.phraseId);
  $('#scannerNoticeText').textContent = `Opción ${scanIndex + 1} de ${buttons.length}: ${phrase ? phrase.text : 'frase'}.`;
}
function stopScanner() {
  if (scannerTimer) clearInterval(scannerTimer);
  scannerTimer = null;
  state.settings.scanEnabled = false;
  $('#scanToggleButton').setAttribute('aria-pressed', 'false');
  $('#scannerNotice').hidden = true;
  $$('.scan-target', $('#phraseGrid')).forEach(el => { el.classList.remove('scan-target'); el.removeAttribute('aria-current'); });
  saveState();
}
function startScanner() {
  state.settings.scanEnabled = true;
  scanIndex = 0;
  $('#scanToggleButton').setAttribute('aria-pressed', 'true');
  $('#scannerNotice').hidden = false;
  updateScannerTargets();
  if (scannerTimer) clearInterval(scannerTimer);
  scannerTimer = setInterval(() => {
    const buttons = $$('.phrase-speak', $('#phraseGrid'));
    if (!buttons.length) { updateScannerTargets(); return; }
    scanIndex = (scanIndex + 1) % buttons.length;
    updateScannerTargets();
  }, 2500);
  saveState();
}
function toggleScanner() {
  if (state.settings.scanEnabled) { stopScanner(); showToast('Modo barrido desactivado.'); }
  else { startScanner(); showToast('Modo barrido activado. La opción resaltada cambia cada 2,5 segundos.'); }
}
function selectScannedPhrase() {
  if (!state.settings.scanEnabled) return;
  const buttons = $$('.phrase-speak', $('#phraseGrid'));
  if (!buttons.length) { showToast('No hay frases para seleccionar en esta vista.'); return; }
  const target = buttons[Math.min(scanIndex, buttons.length - 1)];
  const id = target?.closest('[data-phrase-id]')?.dataset.phraseId;
  const phrase = getPhrase(id);
  if (phrase) speakText(phrase.text);
}

// Navegación y búsqueda
$('#categoryNav').addEventListener('click', event => {
  const button = event.target.closest('[data-view]');
  if (!button) return;
  currentView = button.dataset.view;
  renderAll();
});
$('#phraseSearch').addEventListener('input', event => { searchQuery = event.target.value.trim(); scanIndex = 0; renderPhrases(); });
$('#phraseSearch').addEventListener('keydown', event => { if (event.key === 'Escape') { event.target.value = ''; searchQuery = ''; renderPhrases(); } });
document.addEventListener('keydown', event => {
  if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName) && !$('.app-dialog[open]')) {
    event.preventDefault(); $('#phraseSearch').focus();
  }
  if (event.key === 'Escape' && state.settings.scanEnabled && !$('.app-dialog[open]')) stopScanner();
  // En modo barrido, Enter/Espacio funciona como pulsador si el foco no está en un campo o botón.
  if (state.settings.scanEnabled && ['Enter', ' '].includes(event.key) && (document.activeElement === document.body || document.activeElement === document.documentElement)) {
    event.preventDefault(); selectScannedPhrase();
  }
});

// Frases: hablar, favoritos, edición y borrado
$('#phraseGrid').addEventListener('click', event => {
  const speakButton = event.target.closest('[data-speak-id]');
  if (speakButton) { const phrase = getPhrase(speakButton.dataset.speakId); if (phrase) speakText(phrase.text); return; }
  const favoriteButton = event.target.closest('[data-favorite-id]');
  if (favoriteButton) {
    const id = favoriteButton.dataset.favoriteId;
    state.favorites = state.favorites.includes(id) ? state.favorites.filter(item => item !== id) : [...state.favorites, id];
    saveState(); renderAll(); return;
  }
  const editButton = event.target.closest('[data-edit-id]');
  if (editButton) { const phrase = state.customPhrases.find(item => item.id === editButton.dataset.editId); if (phrase) openPhraseDialog(phrase); return; }
  const deleteButton = event.target.closest('[data-delete-id]');
  if (deleteButton) {
    const phrase = state.customPhrases.find(item => item.id === deleteButton.dataset.deleteId);
    if (!phrase) return;
    if (window.confirm(`¿Querés eliminar la frase «${phrase.text}»?`)) {
      state.customPhrases = state.customPhrases.filter(item => item.id !== phrase.id);
      state.favorites = state.favorites.filter(id => id !== phrase.id);
      saveState(); renderAll(); showToast('Frase eliminada.');
    }
  }
});

// Crear o modificar frases personales
const openNewPhrase = () => openPhraseDialog();
$('#addPhraseButton').addEventListener('click', openNewPhrase);
$('#addPhraseSidebar').addEventListener('click', openNewPhrase);
$('#emptyAddButton').addEventListener('click', openNewPhrase);
$('#phraseCategory').addEventListener('change', event => {
  if (event.target.value === 'emergencia') $('#phraseEmergency').checked = true;
});
$('#phraseForm').addEventListener('submit', event => {
  event.preventDefault();
  const id = $('#phraseId').value;
  const text = $('#phraseText').value.trim();
  const category = $('#phraseCategory').value;
  const emergency = $('#phraseEmergency').checked || category === 'emergencia';
  if (!text) { $('#phraseText').focus(); showToast('Escribí el texto de la frase.'); return; }
  const updated = { id: id || `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, text, category, emoji: categoryEmoji(category), subtitle: 'Tu frase personalizada', emergency, custom: true };
  if (id) state.customPhrases = state.customPhrases.map(phrase => phrase.id === id ? updated : phrase);
  else state.customPhrases.push(updated);
  saveState();
  closeDialog('phraseDialog');
  currentView = 'personalizadas';
  searchQuery = '';
  $('#phraseSearch').value = '';
  renderAll();
  showToast(id ? 'Frase actualizada.' : 'Frase creada.');
});

// Mensaje libre
$('#customMessage').addEventListener('input', event => { $('#characterCount').textContent = `${event.target.value.length} / 500 caracteres`; });
$('#customMessage').addEventListener('keydown', event => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); speakText(event.target.value); } });
$('#speakMessageButton').addEventListener('click', () => speakText($('#customMessage').value));
$('#clearMessageButton').addEventListener('click', () => { $('#customMessage').value = ''; $('#characterCount').textContent = '0 / 500 caracteres'; $('#customMessage').focus(); });
$('#urgentSpeakButton').addEventListener('click', () => speakText('Necesito ayuda'));
$('#scanToggleButton').addEventListener('click', toggleScanner);
$('#scanSelectButton').addEventListener('click', selectScannedPhrase);

// Historial
$('#historyList').addEventListener('click', event => {
  const button = event.target.closest('[data-history-index]');
  if (!button) return;
  const item = state.history[Number(button.dataset.historyIndex)];
  if (item) speakText(item.text);
});
$('#clearHistoryButton').addEventListener('click', () => {
  if (!state.history.length) return;
  if (window.confirm('¿Querés borrar todos los mensajes recientes de este dispositivo?')) { state.history = []; saveState(); renderHistory(); showToast('Historial borrado.'); }
});

// Ajustes y perfil
$('#openSettingsButton').addEventListener('click', openSettings);
$('#openSettingsTop').addEventListener('click', openSettings);
$('#speechRate').addEventListener('input', event => { $('#speechRateValue').textContent = `${Number(event.target.value).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}×`; });
$('#testVoiceButton').addEventListener('click', () => {
  speakText('Esta es una prueba de la voz de ComunicaLibre.', { record: false, rate: Number($('#speechRate').value), voiceURI: $('#voiceSelect').value });
});
$('#settingsForm').addEventListener('submit', event => {
  event.preventDefault();
  state.settings.rate = Number($('#speechRate').value);
  state.settings.voiceURI = $('#voiceSelect').value;
  state.settings.historyEnabled = $('#historyEnabled').checked;
  if (!state.settings.historyEnabled) state.history = [];
  saveState(); renderHistory(); closeDialog('settingsDialog'); showToast('Ajustes guardados.');
});
$('#editProfileButton').addEventListener('click', () => { $('#profileNameInput').value = state.settings.profileName || 'Usuario principal'; openDialog('profileDialog'); setTimeout(() => $('#profileNameInput').focus(), 50); });
$('#profileForm').addEventListener('submit', event => {
  event.preventDefault();
  state.settings.profileName = $('#profileNameInput').value.trim() || 'Usuario principal';
  saveState(); $('#profileName').textContent = state.settings.profileName; closeDialog('profileDialog'); showToast('Perfil actualizado.');
});
$$('[data-close]').forEach(button => button.addEventListener('click', () => closeDialog(button.dataset.close)));
$$('dialog').forEach(dialog => dialog.addEventListener('click', event => {
  if (event.target === dialog) closeDialog(dialog.id);
}));

// Inicialización
if ('speechSynthesis' in window) {
  refreshVoiceOptions();
  window.speechSynthesis.addEventListener?.('voiceschanged', refreshVoiceOptions);
  window.speechSynthesis.onvoiceschanged = refreshVoiceOptions;
}
renderAll();
if (state.settings.scanEnabled) startScanner();
setVoiceStatus(('speechSynthesis' in window) ? 'Voz lista para usar' : 'Voz no disponible', ('speechSynthesis' in window) ? 'ready' : 'error');
