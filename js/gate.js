import { GATE_ENDPOINT, SITE_KEY } from './config.js';

const STORAGE_KEY = 'cj-wedding-unlocked';

const gate = document.getElementById('gate');
const card = gate.querySelector('.gate__card');
const nav = document.querySelector('.nav');
const main = document.getElementById('main');
const form = document.getElementById('gate-form');
const input = document.getElementById('gate-input');
const error = document.getElementById('gate-error');
const submitBtn = form.querySelector('.gate__submit');
const submitLabel = submitBtn.textContent;
const defaultErrorMessage = error.textContent;

function endpointReady() {
  return GATE_ENDPOINT.startsWith('http');
}

function unlock() {
  gate.hidden = true;
  nav.hidden = false;
  main.hidden = false;
  document.body.classList.remove('is-locked');
}

function showError(message) {
  error.textContent = message || defaultErrorMessage;
  error.hidden = false;
  input.value = '';
  input.focus();
  card.classList.remove('gate__card--shake');
  card.offsetWidth; // restart the animation
  card.classList.add('gate__card--shake');
}

let alreadyUnlocked = false;
try {
  alreadyUnlocked = localStorage.getItem(STORAGE_KEY) === 'true';
} catch (err) {
  alreadyUnlocked = false;
}

if (alreadyUnlocked) {
  unlock();
} else {
  document.body.classList.add('is-locked');
  input.focus();
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  error.hidden = true;

  if (!endpointReady()) {
    showError('Password check isn’t connected yet — please check back soon.');
    return;
  }

  const value = input.value.trim();
  if (!value) return;

  submitBtn.disabled = true;
  submitBtn.textContent = 'Checking…';

  try {
    const url = new URL(GATE_ENDPOINT);
    url.searchParams.set('action', 'checkPassword');
    url.searchParams.set('key', SITE_KEY);
    url.searchParams.set('password', value);
    const res = await fetch(url.toString());
    const result = await res.json();

    if (result.ok) {
      try {
        localStorage.setItem(STORAGE_KEY, 'true');
      } catch (err) {
        /* private browsing or storage disabled — still unlock for this visit */
      }
      unlock();
      return;
    }
  } catch (err) {
    /* network error — fall through to the same generic message below */
  }

  showError();
  submitBtn.disabled = false;
  submitBtn.textContent = submitLabel;
});
