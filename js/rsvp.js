import { RSVP_ENDPOINT, SITE_KEY as RSVP_SITE_KEY } from './config.js';

const introView = document.getElementById('rsvp-intro');
const lookupForm = document.getElementById('lookup-form');
const lookupName = document.getElementById('lookup-name');
const lookupError = document.getElementById('lookup-error');
const formWrap = document.getElementById('rsvp-form-wrap');
const submitError = document.getElementById('submit-error');
const successView = document.getElementById('rsvp-success');

const questionsPromise = fetch('data/questions.json', { cache: 'no-store' }).then((r) => r.json());
let currentParty = null;

function endpointReady() {
  return RSVP_ENDPOINT.startsWith('http');
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

function slug(str) {
  return String(str).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
}

function showError(el, message) {
  el.textContent = message;
  el.hidden = false;
}

async function callApi(action, params) {
  // POST, not GET — Apps Script Web Apps cache GET responses at Google's edge
  // regardless of query string, so two different lookups could otherwise get
  // each other's cached result. text/plain keeps this a CORS "simple request"
  // so the browser skips the preflight, which Apps Script doesn't handle.
  const res = await fetch(RSVP_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, key: RSVP_SITE_KEY, ...params }),
  });
  return res.json();
}

function fieldHTML(question, fieldId, kidStatus) {
  const requiredAttr = question.required === false ? '' : 'required';

  if (question.type === 'select') {
    let optionList = question.options || [];
    if (question.kidsMealLabel && kidStatus === 'yes') {
      // Definite kid: choice of the kids meal or none at all (e.g. an
      // infant, or a kid who'll just snack) — not the adult menu.
      optionList = [question.kidsMealLabel, 'None'];
    } else if (question.kidsMealLabel && kidStatus === 'maybe') {
      // Maybe: offer the kids-meal label and "None" alongside the regular options.
      optionList = optionList.concat(question.kidsMealLabel, 'None');
    }
    const options = optionList
      .map((o) => `<option value="${escapeHTML(o)}">${escapeHTML(o)}</option>`)
      .join('');
    return `
      <div class="rsvp-field">
        <label for="${fieldId}">${escapeHTML(question.label)}</label>
        <select id="${fieldId}" ${requiredAttr}>
          <option value="" disabled selected>Choose one</option>
          ${options}
        </select>
      </div>`;
  }
  return `
    <div class="rsvp-field">
      <label for="${fieldId}">${escapeHTML(question.label)}</label>
      <input type="text" id="${fieldId}" placeholder="Type your answer">
    </div>`;
}

async function renderQuestionForm(party) {
  const questions = await questionsPromise;
  const partyQuestions = questions.filter((q) => q.scope === 'party');
  const personQuestions = questions.filter((q) => q.scope !== 'party');

  let html = `
    <p class="eyebrow eyebrow--gold">We found you</p>
    <h1 class="rsvp-page__heading">${escapeHTML(party.partyLabel)}</h1>
  `;

  if (partyQuestions.length) {
    html += '<div class="rsvp-group"><h2 class="rsvp-group__title">A few questions for your party</h2>';
    partyQuestions.forEach((q) => { html += fieldHTML(q, `party__${q.id}`); });
    html += '</div>';
  }

  party.members.forEach((member) => {
    let badge = '';
    if (member.kidStatus === 'yes') {
      badge = '<span class="rsvp-group__badge">Kids menu</span>';
    } else if (member.kidStatus === 'maybe') {
      badge = '<span class="rsvp-group__badge rsvp-group__badge--maybe">Kids meal available</span>';
    }
    html += `<div class="rsvp-group"><p class="rsvp-group__for">RSVP for</p><h2 class="rsvp-group__title">${escapeHTML(member.name)}${badge}</h2>`;
    personQuestions.forEach((q) => {
      html += fieldHTML(q, `person__${slug(member.name)}__${q.id}`, member.kidStatus);
    });
    html += '</div>';
  });

  html += '<button type="submit" class="pill pill--solid pill--lg">Send RSVP</button>';

  formWrap.innerHTML = `<form id="answers-form">${html}</form>`;
  formWrap.hidden = false;
  document.getElementById('answers-form').addEventListener('submit', onSubmitAnswers);
}

lookupForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  lookupError.hidden = true;

  if (!endpointReady()) {
    showError(lookupError, 'RSVP isn’t connected yet — please check back soon.');
    return;
  }

  const name = lookupName.value.trim();
  if (!name) return;

  const submitBtn = lookupForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;

  try {
    const result = await callApi('lookup', { name });
    if (!result.found) {
      showError(
        lookupError,
        'We couldn’t find that name. Try it exactly as it appears on your invitation, or email jalali.haas@gmail.com directly.'
      );
      return;
    }
    currentParty = result;
    introView.hidden = true;
    await renderQuestionForm(result);
  } catch (err) {
    showError(lookupError, 'Something went wrong — please try again in a moment.');
  } finally {
    submitBtn.disabled = false;
  }
});

async function onSubmitAnswers(event) {
  event.preventDefault();
  submitError.hidden = true;
  const form = event.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;

  try {
    const questions = await questionsPromise;
    const partyAnswers = {};
    questions
      .filter((q) => q.scope === 'party')
      .forEach((q) => {
        const el = form.querySelector(`#party__${q.id}`);
        if (el) partyAnswers[q.id] = el.value;
      });

    const responses = currentParty.members.map((member) => {
      const answers = {};
      questions
        .filter((q) => q.scope !== 'party')
        .forEach((q) => {
          const el = form.querySelector(`#person__${slug(member.name)}__${q.id}`);
          if (el) answers[q.id] = el.value;
        });
      return { guestName: member.name, kidStatus: member.kidStatus, answers };
    });

    const payload = {
      action: 'submit',
      key: RSVP_SITE_KEY,
      partyId: currentParty.partyId,
      partyLabel: currentParty.partyLabel,
      partyAnswers,
      responses,
    };

    // Sent as text/plain (not application/json) so the browser treats this as a
    // "simple request" and skips the CORS preflight — Apps Script Web Apps don't
    // handle preflight OPTIONS requests, so a JSON content-type here would fail silently.
    const res = await fetch(RSVP_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    if (!result.ok) throw new Error(result.error || 'submit failed');

    formWrap.hidden = true;
    successView.hidden = false;
  } catch (err) {
    submitBtn.disabled = false;
    showError(
      submitError,
      'Something went wrong sending your RSVP — please try again, or email jalali.haas@gmail.com directly.'
    );
  }
}
