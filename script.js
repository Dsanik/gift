// =============================================================
// Пул комплиментов из compliments.js
// =============================================================

const POOLS = window.COMPLIMENTS || {
  antique: ["Рядом с тобой даже пасмурный день кажется солнечным."],
  fun:     ["Ты как утренний кофе — без тебя день не начинается."]
};

// Индексы уже показанных комплиментов — отдельно для каждого пула,
// чтобы не повторяться, пока пул не кончится.
const used = { antique: [], fun: [] };

// Текущий режим: 'antique' или 'fun'
let currentMode = 'antique';

function pickCompliment(mode = currentMode) {
  const pool = POOLS[mode];
  if (!pool || !pool.length) return '…';
  if (used[mode].length >= pool.length) used[mode].length = 0;

  let idx;
  do {
    idx = Math.floor(Math.random() * pool.length);
  } while (used[mode].includes(idx));

  used[mode].push(idx);
  return pool[idx];
}

// =============================================================
// Элементы страницы
// =============================================================

const gift           = document.getElementById('gift');
const bunnies        = document.getElementById('bunnies');
const hint           = document.getElementById('hint');
const complimentBox  = document.getElementById('compliment');
const complimentText = document.getElementById('complimentText');
const nextBtn        = document.getElementById('nextBtn');
const modeToggle     = document.getElementById('modeToggle');
const soundToggle    = document.getElementById('soundToggle');

// =============================================================
// Плавная смена текста комплимента
// =============================================================

function setCompliment(text) {
  complimentText.classList.add('swapping');
  setTimeout(() => {
    complimentText.textContent = text;
    complimentText.classList.remove('swapping');
  }, 180);
}

// =============================================================
// Открытие подарка
// =============================================================

gift.addEventListener('click', () => {
  if (gift.classList.contains('opened')) return;

  gift.classList.add('opened');
  bunnies.classList.add('opened');
  hint.classList.add('hidden');
  playChime();

  setTimeout(() => {
    setCompliment(pickCompliment());
    complimentBox.classList.add('show');
  }, 900);
});

// =============================================================
// Кнопка «Ещё 💌» — следующий комплимент из текущего пула
// =============================================================

nextBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  setCompliment(pickCompliment());
  playSoftPluck();
});

// =============================================================
// Переключатель режимов: 🏛 Античность / 😄 Весело
// =============================================================

modeToggle.addEventListener('click', (e) => {
  const btn = e.target.closest('.mode-btn');
  if (!btn) return;

  const mode = btn.dataset.mode;
  if (mode === currentMode) return;

  currentMode = mode;

  modeToggle.querySelectorAll('.mode-btn').forEach(b => {
    b.classList.toggle('active', b === btn);
  });

  setCompliment(pickCompliment());
  playSoftPluck();
});

// =============================================================
// Web Audio: фоновая мелодия + звуки
// =============================================================

let audioCtx = null;
let musicPlaying = false;
let musicTimer = null;

function ensureAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

// Простая зацикленная мелодия
const melody = [523.25, 587.33, 659.25, 587.33, 523.25, 440.00, 493.88, 523.25];
let noteIndex = 0;

function playMelodyNote() {
  if (!musicPlaying) return;
  const freq = melody[noteIndex % melody.length];
  noteIndex++;

  const osc  = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;

  gain.gain.setValueAtTime(0, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(0.06, audioCtx.currentTime + 0.15);
  gain.gain.linearRampToValueAtTime(0,   audioCtx.currentTime + 0.9);

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.9);

  musicTimer = setTimeout(playMelodyNote, 650);
}

function startMusic() {
  ensureAudioContext();
  musicPlaying = true;
  noteIndex = 0;
  playMelodyNote();
  soundToggle.textContent = '🔊';
  soundToggle.setAttribute('aria-label', 'Выключить музыку');
}

function stopMusic() {
  musicPlaying = false;
  clearTimeout(musicTimer);
  soundToggle.textContent = '🔇';
  soundToggle.setAttribute('aria-label', 'Включить музыку');
}

soundToggle.addEventListener('click', () => {
  if (musicPlaying) stopMusic();
  else startMusic();
});

// Короткий перезвон при открытии подарка
function playChime() {
  ensureAudioContext();
  const notes = [659.25, 783.99, 987.77]; // E5 G5 B5
  notes.forEach((freq, i) => {
    const osc  = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;

    const start = audioCtx.currentTime + i * 0.12;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.09, start + 0.05);
    gain.gain.linearRampToValueAtTime(0,    start + 0.7);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(start);
    osc.stop(start + 0.7);
  });
}

// Мягкий звук для кнопок «Ещё» и переключателя
function playSoftPluck() {
  ensureAudioContext();
  const osc  = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'triangle';
  osc.frequency.value = 740;

  gain.gain.setValueAtTime(0, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(0.07, audioCtx.currentTime + 0.03);
  gain.gain.linearRampToValueAtTime(0,    audioCtx.currentTime + 0.35);

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.35);
}
