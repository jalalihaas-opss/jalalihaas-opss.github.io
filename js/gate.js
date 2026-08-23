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
    // POST, not GET — Apps Script Web Apps cache GET responses at Google's edge
    // regardless of query string, so a GET here would keep returning whatever
    // the first-ever request happened to get. text/plain (not application/json)
    // keeps this a CORS "simple request" so the browser skips the preflight,
    // which Apps Script Web Apps don't handle.
    const res = await fetch(GATE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'checkPassword', key: SITE_KEY, password: value }),
    });
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
