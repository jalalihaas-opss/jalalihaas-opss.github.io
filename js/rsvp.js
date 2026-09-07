import { RSVP_ENDPOINT, SITE_KEY as RSVP_SITE_KEY } from './config.js';

const introView = document.getElementById('rsvp-intro');
const lookupForm = document.getElementById('lookup-form');
const lookupName = document.getElementById('lookup-name');
const lookupError = document.getElementById('lookup-error');
const formWrap = document.getElementById('rsvp-form-wrap');
const submitError = document.getElementById('submit-error');

const questionsPromise = fetch('data/questions.json', { cache: 'no-store' }).then((r) => r.json());

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

function firstName(fullName) {
  return String(fullName || '').trim().split(/\s+/)[0] || '';
}

function cap(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const NUM_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
function numWord(n) {
  return NUM_WORDS[n] || String(n);
}

function joinNames(names) {
  if (names.length <= 1) return names[0] || '';
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function radioEl(name, value) {
  return document.querySelector(`input[name="${CSS.escape(name)}"][value="${CSS.escape(value)}"]`);
}

function kidBadgeHTML(kidStatus) {
  if (kidStatus === 'yes') return '<span class="rsvp2-card__badge">Kids menu</span>';
  if (kidStatus === 'maybe') return '<span class="rsvp2-card__badge">Kids meal available</span>';
  return '';
}

function mealOptions(mealQ, kidStatus) {
  let opts = mealQ.options.slice();
  if (mealQ.kidsMealLabel && kidStatus === 'yes') {
    // Definite kid: choice of the kids meal or none at all — not the adult menu.
    opts = [mealQ.kidsMealLabel, 'None'];
  } else if (mealQ.kidsMealLabel && kidStatus === 'maybe') {
    opts = opts.concat(mealQ.kidsMealLabel, 'None');
  }
  return opts;
}

// A choice tile: a real radio input, visually hidden, paired with a styled
// <label> so selection keeps native radio semantics/keyboard support while
// looking like the design's rectangular tiles (see .rsvp2-tile in styles.css).
function tile(name, value, label, opts = {}) {
  const id = `${slug(name)}__${slug(value)}`;
  const cls = ['rsvp2-tile', opts.variant ? `rsvp2-tile--${opts.variant}` : ''].filter(Boolean).join(' ');
  const dot = opts.dot ? '<span class="rsvp2-tile__dot"></span>' : '';
  return `
    <label class="${cls}">
      <input type="radio" class="rsvp2-tile__input" id="${id}" name="${escapeHTML(name)}" value="${escapeHTML(value)}">
      ${dot}<span class="rsvp2-tile__label">${escapeHTML(label)}</span>
    </label>`;
}

function pageShellHTML(party, n) {
  const introText = n === 1
    ? 'There is <strong>one person</strong> in your invitation. Please answer below.'
    : `There are <strong>${numWord(n)} people</strong> in your invitation. Please answer for each one below.`;

  return `
    <div class="rsvp2">
      <div class="rsvp2__header">
        <div class="rsvp2__eyebrow">We found you</div>
        <div class="rsvp2__title">${escapeHTML(party.partyLabel)}</div>
        <div class="rsvp2__divider">
          <div class="rsvp2__divider-line"></div>
          <div class="rsvp2__divider-dot"></div>
          <div class="rsvp2__divider-line rsvp2__divider-line--r"></div>
        </div>
        <div class="rsvp2__intro">${introText}</div>
      </div>

      <div id="rsvp2-flow" class="rsvp2__body">
        <button type="button" id="rsvp2-banner" class="rsvp2__banner">
          <span class="rsvp2__banner-dot"></span>
          <span id="rsvp2-banner-label" class="rsvp2__banner-label"></span>
        </button>

        <div id="rsvp2-cards" class="rsvp2__cards"></div>

        <div class="rsvp2-notes">
          <label class="rsvp2-field__label" for="rsvp2-party-notes">Anything else we should know?</label>
          <input type="text" id="rsvp2-party-notes" class="rsvp2-input" placeholder="Optional">
        </div>

        <div class="rsvp2-send-row">
          <button type="button" id="rsvp2-send" class="rsvp2-send" disabled>
            <span class="rsvp2-send__dot"></span>
            <span class="rsvp2-send__label">Send our reply</span>
          </button>
          <div id="rsvp2-progress" class="rsvp2-progress"></div>
        </div>
      </div>

      <div id="rsvp2-confirm-wrap" class="rsvp2-confirm" hidden></div>
    </div>`;
}

function guestCardHTML(member, i, byId) {
  const num = i + 1;
  const showSoccer = !!byId.soccer && !!byId.jersey_size;
  const meal = byId.meal;
  const mealOpts = mealOptions(meal, member.kidStatus);

  const attendingTiles = `
    <div class="rsvp2-q">
      <div class="rsvp2-q__prompt">${escapeHTML(byId.attending.label)}</div>
      <div class="rsvp2-tiles rsvp2-tiles--1">
        ${tile(`attending-${i}`, byId.attending.options[0], byId.attending.options[0], { variant: 'accept', dot: true })}
        ${tile(`attending-${i}`, byId.attending.options[1], byId.attending.options[1], { variant: 'accept', dot: true })}
      </div>
    </div>`;

  const soccerBlock = showSoccer ? `
    <div class="rsvp2-field">
      <div class="rsvp2-field__label">${escapeHTML(byId.soccer.label)}</div>
      <div class="rsvp2-tiles rsvp2-tiles--2">
        ${byId.soccer.options.map((o) => tile(`soccer-${i}`, o, o, { variant: 'bool' })).join('')}
      </div>
    </div>
    <div id="rsvp2-jersey-${i}" class="rsvp2-jersey" hidden>
      <div class="rsvp2-field__label">${escapeHTML(byId.jersey_size.label)}</div>
      <div class="rsvp2-tiles rsvp2-tiles--jersey">
        ${byId.jersey_size.options.map((o) => tile(`jersey_size-${i}`, o, o, { variant: 'jersey' })).join('')}
      </div>
    </div>` : '';

  const weekendGroup = `
    <div class="rsvp2-group-head">
      <div class="rsvp2-group-head__label">I &middot; The weekend</div>
      <div class="rsvp2-group-head__line"></div>
    </div>
    <div class="rsvp2-field">
      <div class="rsvp2-field__label">${escapeHTML(byId.friday.label)}</div>
      <div class="rsvp2-tiles rsvp2-tiles--2">
        ${byId.friday.options.map((o) => tile(`friday-${i}`, o, o, { variant: 'bool' })).join('')}
      </div>
    </div>
    <div class="rsvp2-field">
      <div class="rsvp2-field__label">${escapeHTML(byId.saturday_brunch.label)}</div>
      <div class="rsvp2-tiles rsvp2-tiles--2">
        ${byId.saturday_brunch.options.map((o) => tile(`saturday_brunch-${i}`, o, o, { variant: 'bool' })).join('')}
      </div>
    </div>
    ${soccerBlock}`;

  const tableGroup = `
    <div class="rsvp2-group-head">
      <div class="rsvp2-group-head__label">II &middot; At the table</div>
      <div class="rsvp2-group-head__line"></div>
    </div>
    <div class="rsvp2-field">
      <div class="rsvp2-field__label">${escapeHTML(meal.label)}</div>
      <div class="rsvp2-tiles rsvp2-tiles--3">
        ${mealOpts.map((o) => tile(`meal-${i}`, o, o, { variant: 'meal', dot: true })).join('')}
      </div>
    </div>
    <div class="rsvp2-field rsvp2-field--text">
      <label class="rsvp2-field__label" for="allergies-${i}">${escapeHTML(byId.dietary.label)}</label>
      <input type="text" id="allergies-${i}" class="rsvp2-input" placeholder="Optional">
    </div>`;

  const smallPrintGroup = `
    <div class="rsvp2-group-head">
      <div class="rsvp2-group-head__label">III &middot; The small print</div>
      <div class="rsvp2-group-head__line"></div>
    </div>
    <div class="rsvp2-field rsvp2-field--text">
      <label class="rsvp2-field__label" for="placename-${i}">${escapeHTML(byId.place_card_name.label)}</label>
      <input type="text" id="placename-${i}" class="rsvp2-input" placeholder="${escapeHTML(member.name)}">
    </div>
    <div class="rsvp2-field rsvp2-field--text">
      <label class="rsvp2-field__label" for="song-${i}">${escapeHTML(byId.song.label)}</label>
      <input type="text" id="song-${i}" class="rsvp2-input" placeholder="Artist — title">
    </div>`;

  return `
    <div id="rsvp2-card-${i}" class="rsvp2-card">
      <div class="rsvp2-card__frame"></div>
      <button type="button" id="rsvp2-header-${i}" class="rsvp2-card__header" aria-expanded="false" aria-controls="rsvp2-body-${i}">
        <span id="rsvp2-num-${i}" class="rsvp2-card__num">${num}</span>
        <span class="rsvp2-card__mid">
          <span class="rsvp2-card__for">Rsvp for</span>
          <span class="rsvp2-card__name">${escapeHTML(member.name)}${kidBadgeHTML(member.kidStatus)}</span>
          <span id="rsvp2-status-${i}" class="rsvp2-card__status">Not answered yet</span>
        </span>
        <span class="rsvp2-card__toggle">
          <span id="rsvp2-toggle-label-${i}" class="rsvp2-card__toggle-label">Answer</span>
          <span id="rsvp2-caret-${i}" class="rsvp2-card__caret"></span>
        </span>
      </button>
      <div id="rsvp2-body-${i}" class="rsvp2-card__body" hidden>
        <div class="rsvp2-card__hr"></div>
        ${attendingTiles}
        <div id="rsvp2-attending-${i}" class="rsvp2-attending" hidden>
          ${weekendGroup}
          ${tableGroup}
          ${smallPrintGroup}
        </div>
        <div id="rsvp2-declined-${i}" class="rsvp2-decline" hidden>
          <div class="rsvp2-decline__text">You will be missed. Leave them a line, if you like.</div>
          <input type="text" id="declinenote-${i}" class="rsvp2-input rsvp2-input--center" placeholder="Optional">
        </div>
        <button type="button" id="rsvp2-done-${i}" class="rsvp2-done" hidden>Done</button>
      </div>
    </div>`;
}

async function renderQuestionForm(party) {
  const questions = await questionsPromise;
  const byId = Object.fromEntries(questions.map((q) => [q.id, q]));
  const members = party.members;
  const n = members.length;

  const attend = new Array(n).fill(null);
  let openIndex = 0;

  formWrap.innerHTML = pageShellHTML(party, n);
  formWrap.hidden = false;

  const flowEl = document.getElementById('rsvp2-flow');
  const confirmEl = document.getElementById('rsvp2-confirm-wrap');
  const bannerEl = document.getElementById('rsvp2-banner');
  const bannerLabelEl = document.getElementById('rsvp2-banner-label');
  const cardsEl = document.getElementById('rsvp2-cards');
  const sendBtn = document.getElementById('rsvp2-send');
  const progressEl = document.getElementById('rsvp2-progress');

  members.forEach((member, i) => {
    cardsEl.insertAdjacentHTML('beforeend', guestCardHTML(member, i, byId));
  });

  function reveal(i) {
    const el = document.getElementById(`rsvp2-card-${i}`);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 20;
    window.scrollTo({ top: Math.max(top, 0), behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }

  function goTo(i) {
    openIndex = i;
    syncOpenStates();
    setTimeout(() => reveal(i), 60);
  }

  function answered(i) {
    return attend[i] === true || attend[i] === false;
  }

  function allAnswered() {
    return attend.every((a) => a === true || a === false);
  }

  function answeredCount() {
    return attend.filter((a) => a === true || a === false).length;
  }

  function firstUnanswered() {
    return attend.findIndex((a) => a !== true && a !== false);
  }

  // Next unanswered guest after `after`, wrapping, excluding `after` itself.
  function nextUnanswered(after) {
    for (let step = 1; step < n; step++) {
      const idx = (after + step) % n;
      if (!answered(idx)) return idx;
    }
    return -1;
  }

  function syncOpenStates() {
    members.forEach((_, i) => {
      const card = document.getElementById(`rsvp2-card-${i}`);
      const body = document.getElementById(`rsvp2-body-${i}`);
      const header = document.getElementById(`rsvp2-header-${i}`);
      const num = document.getElementById(`rsvp2-num-${i}`);
      const caret = document.getElementById(`rsvp2-caret-${i}`);
      const toggleLabel = document.getElementById(`rsvp2-toggle-label-${i}`);
      const isOpen = openIndex === i;
      card.classList.toggle('rsvp2-card--open', isOpen);
      body.hidden = !isOpen;
      header.setAttribute('aria-expanded', String(isOpen));
      num.classList.toggle('rsvp2-card__num--open', isOpen);
      caret.classList.toggle('rsvp2-card__caret--open', isOpen);
      toggleLabel.textContent = isOpen ? 'Close' : (answered(i) ? 'Change' : 'Answer');
    });
  }

  function updateAggregate() {
    const done = answeredCount();
    const both = done === n;

    bannerLabelEl.textContent = both
      ? (n === 2 ? 'Both answered — send your reply below' : 'All answered — send your reply below')
      : (() => {
          const pending = firstUnanswered();
          return `Step ${done + 1} of ${n} — tap here to ${done === 0 ? 'start with' : 'answer for'} ${firstName(members[pending].name)}`;
        })();

    progressEl.textContent = done === 0 ? 'No answers yet' : `${cap(numWord(done))} of ${numWord(n)} answered`;

    sendBtn.disabled = !both;

    members.forEach((_, i) => {
      const doneBtn = document.getElementById(`rsvp2-done-${i}`);
      const next = nextUnanswered(i);
      doneBtn.textContent = next === -1 ? 'Done' : `Done — next, ${firstName(members[next].name)}`;
    });
  }

  bannerEl.addEventListener('click', () => {
    if (allAnswered()) {
      openIndex = -1;
      syncOpenStates();
      return;
    }
    goTo(firstUnanswered());
  });

  function wireGuestCard(member, i) {
    const header = document.getElementById(`rsvp2-header-${i}`);
    const statusEl = document.getElementById(`rsvp2-status-${i}`);
    const attendingBlock = document.getElementById(`rsvp2-attending-${i}`);
    const declinedBlock = document.getElementById(`rsvp2-declined-${i}`);
    const doneBtn = document.getElementById(`rsvp2-done-${i}`);
    const jerseyBlock = document.getElementById(`rsvp2-jersey-${i}`);
    const jerseyInputs = jerseyBlock ? jerseyBlock.querySelectorAll('input') : [];
    const attendYes = radioEl(`attending-${i}`, byId.attending.options[0]);
    const attendNo = radioEl(`attending-${i}`, byId.attending.options[1]);
    const soccerYes = byId.soccer && radioEl(`soccer-${i}`, byId.soccer.options[0]);
    const soccerNo = byId.soccer && radioEl(`soccer-${i}`, byId.soccer.options[1]);

    header.addEventListener('click', () => {
      const wasOpen = openIndex === i;
      openIndex = wasOpen ? -1 : i;
      syncOpenStates();
      if (!wasOpen) setTimeout(() => reveal(i), 60);
    });

    function syncAttendUI() {
      const isYes = attend[i] === true;
      const isNo = attend[i] === false;
      attendingBlock.hidden = !isYes;
      declinedBlock.hidden = !isNo;
      doneBtn.hidden = attend[i] === null;
      statusEl.textContent = isYes ? 'Attending' : isNo ? 'Sends regrets' : 'Not answered yet';
      statusEl.classList.toggle('rsvp2-card__status--done', isYes || isNo);
    }

    [[attendYes, true], [attendNo, false]].forEach(([el, val]) => {
      el.addEventListener('change', () => {
        attend[i] = val;
        syncAttendUI();
        updateAggregate();
        if (val === false) {
          const target = nextUnanswered(i);
          if (target !== -1) setTimeout(() => goTo(target), 420);
        }
      });
    });

    if (soccerYes && soccerNo && jerseyBlock) {
      const syncSoccer = (show) => {
        jerseyBlock.hidden = !show;
        if (!show) jerseyInputs.forEach((el) => { el.checked = false; });
      };
      soccerYes.addEventListener('change', () => syncSoccer(true));
      soccerNo.addEventListener('change', () => syncSoccer(false));
    }

    doneBtn.addEventListener('click', () => {
      const next = nextUnanswered(i);
      if (next !== -1) {
        goTo(next);
      } else {
        openIndex = -1;
        syncOpenStates();
        setTimeout(() => reveal(i), 60);
      }
    });

    syncAttendUI();
  }

  members.forEach((member, i) => wireGuestCard(member, i));
  syncOpenStates();
  updateAggregate();

  function confirmationHTML() {
    const yesNames = members.filter((_, i) => attend[i] === true).map((m) => firstName(m.name));
    let summary;
    if (yesNames.length === n) {
      summary = n === 1
        ? 'We have you down for the weekend. Details will follow closer to the day.'
        : n === 2
          ? 'We have you both down for the weekend. Details will follow closer to the day.'
          : 'We have you all down for the weekend. Details will follow closer to the day.';
    } else if (yesNames.length === 0) {
      summary = n === 1
        ? 'We are sorry to miss you — thank you for letting us know.'
        : n === 2
          ? 'We are sorry to miss you both — thank you for letting us know.'
          : 'We are sorry to miss you all — thank you for letting us know.';
    } else {
      summary = `We have ${joinNames(yesNames)} down for the weekend. Details will follow closer to the day.`;
    }

    return `
      <div class="rsvp2-confirm__frame"></div>
      <div class="rsvp2-confirm__inner">
        <div class="rsvp2-confirm__dot"></div>
        <div class="rsvp2-confirm__title">Thank you — your reply is in</div>
        <div class="rsvp2-confirm__summary">${escapeHTML(summary)}</div>
        <div class="rsvp2-confirm__rule">
          <div class="rsvp2-confirm__rule-line"></div>
          <div class="rsvp2-confirm__always">Always &amp; forever</div>
          <div class="rsvp2-confirm__rule-line rsvp2-confirm__rule-line--r"></div>
        </div>
        <button type="button" id="rsvp2-confirm-edit" class="rsvp2-confirm__edit">Change our answers</button>
      </div>`;
  }

  function showConfirmation() {
    flowEl.hidden = true;
    confirmEl.hidden = false;
    confirmEl.innerHTML = confirmationHTML();
    document.getElementById('rsvp2-confirm-edit').addEventListener('click', () => {
      confirmEl.hidden = true;
      flowEl.hidden = false;
      openIndex = 0;
      syncOpenStates();
    });
  }

  async function submitAnswers() {
    submitError.hidden = true;
    sendBtn.disabled = true;

    try {
      const partyAnswers = {};
      if (byId.notes) {
        const notesEl = document.getElementById('rsvp2-party-notes');
        if (notesEl) partyAnswers[byId.notes.id] = notesEl.value;
      }

      const responses = members.map((member, i) => {
        const answers = {};
        if (attend[i] === false) {
          answers[byId.attending.id] = byId.attending.options[1];
          // The decline note reuses the dietary field's data slot — a declining
          // guest never fills in dietary notes, and the handoff calls for no new
          // sheet columns beyond jersey_size.
          const declineNoteEl = document.getElementById(`declinenote-${i}`);
          answers[byId.dietary.id] = declineNoteEl ? declineNoteEl.value : '';
        } else {
          answers[byId.attending.id] = byId.attending.options[0];
          ['friday', 'saturday_brunch', 'soccer', 'jersey_size'].forEach((qid) => {
            if (!byId[qid]) return;
            const checked = document.querySelector(`input[name="${CSS.escape(qid)}-${i}"]:checked`);
            if (checked) answers[qid] = checked.value;
          });
          const mealChecked = document.querySelector(`input[name="meal-${i}"]:checked`);
          if (mealChecked) answers[byId.meal.id] = mealChecked.value;
          const allergiesEl = document.getElementById(`allergies-${i}`);
          if (allergiesEl) answers[byId.dietary.id] = allergiesEl.value;
          const placeNameEl = document.getElementById(`placename-${i}`);
          if (placeNameEl) answers[byId.place_card_name.id] = placeNameEl.value;
          const songEl = document.getElementById(`song-${i}`);
          if (songEl) answers[byId.song.id] = songEl.value;
        }
        return { guestName: member.name, kidStatus: member.kidStatus, answers };
      });

      const payload = {
        action: 'submit',
        key: RSVP_SITE_KEY,
        partyId: party.partyId,
        partyLabel: party.partyLabel,
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

      showConfirmation();
    } catch (err) {
      sendBtn.disabled = !allAnswered();
      showError(
        submitError,
        'Something went wrong sending your RSVP — please try again, or email jalali.haas@gmail.com directly.'
      );
    }
  }

  sendBtn.addEventListener('click', () => { submitAnswers(); });
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
    introView.hidden = true;
    await renderQuestionForm(result);
  } catch (err) {
    showError(lookupError, 'Something went wrong — please try again in a moment.');
  } finally {
    submitBtn.disabled = false;
  }
});
