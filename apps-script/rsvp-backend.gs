// Open the RSVP Google Sheet itself, then Extensions > Apps Script — this "binds"
// the script to that one document, which is what gets you the narrower "only this
// spreadsheet" permission instead of "all your Sheets". Before clicking Extensions,
// double-check the account switcher (top-right of Sheets) shows the account that
// owns this Sheet — the earlier "unable to open" error was a multi-account mixup,
// not a real problem with this approach. Paste this whole file in, then deploy as
// a Web App. This runs entirely on Google's servers — never in the site's repo.

const SITE_KEY = 'movid-rsvp-2027'; // must match SITE_KEY in js/config.js
const GUESTS_SHEET = 'Guests';
const RESPONSES_SHEET = 'Responses';
const TOTALS_SHEET = 'Totals';
const NOTIFY_EMAIL = 'jalali.haas@gmail.com';

// Must match the meal question's "kidsMealLabel" in data/questions.json —
// used by updateTotals() to tell a kid's response from an adult's by what
// they actually picked, not just their static Guests-sheet status.
const KIDS_MEAL_LABEL = 'Kids Meal';

function doGet(e) {
  return handle(e);
}

function doPost(e) {
  return handle(e);
}

function handle(e) {
  try {
    const params = (e && e.parameter) || {};
    const body = e && e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
    const action = params.action || body.action;
    const key = params.key || body.key;

    if (key !== SITE_KEY) {
      return json({ error: 'unauthorized' });
    }
    if (action === 'lookup') {
      return json(lookupParty(params.name || body.name || ''));
    }
    if (action === 'submit') {
      return json(submitResponse(body));
    }
    return json({ error: 'unknown action' });
  } catch (err) {
    return json({ error: String(err) });
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function normalize(name) {
  return String(name || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function rowMatchesName(row, idxName, idxNickname, target) {
  if (normalize(row[idxName]) === target) return true;
  if (idxNickname > -1 && row[idxNickname]) {
    const nicknames = String(row[idxNickname]).split(',').map(normalize);
    if (nicknames.includes(target)) return true;
  }
  return false;
}

// IsKid column accepts: Yes/TRUE/Y/1 (definite kid, no meal choice),
// Maybe (offer kids meal alongside the regular options), or blank/No (adult).
function kidStatus(value) {
  const v = String(value == null ? '' : value).trim().toLowerCase();
  if (v === 'maybe' || v === 'm') return 'maybe';
  if (v === 'true' || v === 'yes' || v === 'y' || v === '1') return 'yes';
  return 'no';
}

function lookupParty(name) {
  const target = normalize(name);
  if (!target) return { found: false };

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(GUESTS_SHEET);
  const rows = sheet.getDataRange().getValues();
  const header = rows[0].map(h => String(h).trim());
  const idxParty = header.indexOf('PartyID');
  const idxName = header.indexOf('GuestName');
  const idxLabel = header.indexOf('PartyLabel');
  const idxNickname = header.indexOf('Nickname');
  const idxKid = header.indexOf('IsKid');

  let match = null;
  for (let i = 1; i < rows.length; i++) {
    if (rowMatchesName(rows[i], idxName, idxNickname, target)) {
      match = rows[i];
      break;
    }
  }
  if (!match) return { found: false };

  const partyId = match[idxParty];
  const members = [];
  let label = '';
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][idxParty]) === String(partyId)) {
      members.push({
        name: String(rows[i][idxName]),
        kidStatus: idxKid > -1 ? kidStatus(rows[i][idxKid]) : 'no',
      });
      if (idxLabel > -1 && rows[i][idxLabel]) label = String(rows[i][idxLabel]);
    }
  }

  return {
    found: true,
    partyId: String(partyId),
    partyLabel: label || members.map(m => m.name).join(' & '),
    members,
  };
}

// Key used to match a response row back to the person who sent it, so a
// resubmission updates their existing row instead of appending a duplicate.
// Includes PartyID (not just name) so two different parties can't collide
// if they happen to share a guest's name.
function responseKey(partyId, guestName) {
  return normalize(partyId) + '|' + normalize(guestName);
}

function submitResponse(body) {
  const partyId = body.partyId;
  const partyLabel = body.partyLabel || '';
  const partyAnswers = body.partyAnswers || {};
  const responses = body.responses || []; // [{ guestName, kidStatus, answers: { questionId: value } }]

  if (!partyId || !responses.length) {
    return { ok: false, error: 'missing partyId or responses' };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(RESPONSES_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(RESPONSES_SHEET);
    sheet.appendRow(['Timestamp', 'PartyID', 'PartyLabel', 'GuestName']);
  }

  let header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const colIndex = {};
  header.forEach((h, i) => { colIndex[h] = i; });

  function ensureColumn(key) {
    if (colIndex[key] !== undefined) return;
    const newCol = sheet.getLastColumn() + 1;
    sheet.getRange(1, newCol).setValue(key);
    colIndex[key] = newCol - 1;
  }

  // Snapshot existing rows so a resubmission overwrites the same row instead
  // of appending a duplicate. Only PartyID (col B) and GuestName (col D) are
  // read here, so columns added below via ensureColumn don't affect this.
  const existingRows = sheet.getDataRange().getValues();
  const rowNumberByKey = {};
  for (let r = 1; r < existingRows.length; r++) {
    const k = responseKey(existingRows[r][1], existingRows[r][3]);
    if (k !== '|') rowNumberByKey[k] = r + 1; // 1-indexed sheet row
  }

  const now = new Date();
  const emailLines = [];
  let anyUpdated = false;

  responses.forEach(person => {
    const merged = Object.assign(
      { KidStatus: person.kidStatus || 'no' },
      partyAnswers,
      person.answers || {}
    );
    Object.keys(merged).forEach(ensureColumn);

    const width = sheet.getLastColumn();
    const row = new Array(width).fill('');
    row[0] = now;
    row[1] = partyId;
    row[2] = partyLabel;
    row[3] = person.guestName || '';
    Object.keys(merged).forEach(key => { row[colIndex[key]] = merged[key]; });

    const key = responseKey(partyId, person.guestName);
    const existingRowNum = rowNumberByKey[key];

    if (existingRowNum) {
      sheet.getRange(existingRowNum, 1, 1, width).setValues([row]);
      anyUpdated = true;
    } else {
      sheet.appendRow(row);
      rowNumberByKey[key] = sheet.getLastRow();
    }

    emailLines.push(`${person.guestName}:`);
    Object.keys(merged).forEach(k => emailLines.push(`  ${k}: ${merged[k]}`));
    emailLines.push('');
  });

  emailLines.unshift(
    anyUpdated ? 'This updates a previous response.' : 'First response from this party.',
    ''
  );

  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: `RSVP ${anyUpdated ? 'updated' : 'received'} — ${partyLabel || partyId}`,
    body: emailLines.join('\n'),
  });

  updateTotals();

  return { ok: true };
}

// Recomputes the Totals tab from scratch on every submission, rather than
// incrementing/decrementing counters — that sidesteps having to reason about
// every way a resubmission could change the numbers (new party member,
// flipped answer, changed kid status, etc.). Always correct because it's
// always derived fresh from the current state of Guests + Responses.
function updateTotals() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const guestsSheet = ss.getSheetByName(GUESTS_SHEET);
  const responsesSheet = ss.getSheetByName(RESPONSES_SHEET);
  if (!guestsSheet) return;

  const guestRows = guestsSheet.getDataRange().getValues();
  const gHeader = guestRows[0].map(h => String(h).trim());
  const gIdxParty = gHeader.indexOf('PartyID');
  const gIdxName = gHeader.indexOf('GuestName');
  const gIdxKid = gHeader.indexOf('IsKid');

  const invited = []; // { key, name, kidStatus }
  for (let i = 1; i < guestRows.length; i++) {
    const name = String(guestRows[i][gIdxName] || '').trim();
    if (!name) continue;
    invited.push({
      key: responseKey(guestRows[i][gIdxParty], name),
      name,
      kidStatus: gIdxKid > -1 ? kidStatus(guestRows[i][gIdxKid]) : 'no',
    });
  }

  // Latest response per person, keyed the same way as submitResponse's
  // dedupe logic — guaranteed at most one row per person already, but keyed
  // lookup here anyway in case Responses was ever edited by hand.
  const responded = {}; // key -> { meal, attending }
  if (responsesSheet) {
    const respRows = responsesSheet.getDataRange().getValues();
    if (respRows.length > 1) {
      const rHeader = respRows[0].map(h => String(h).trim());
      const rIdxParty = rHeader.indexOf('PartyID');
      const rIdxName = rHeader.indexOf('GuestName');
      const rIdxMeal = rHeader.indexOf('meal');
      const rIdxAttending = rHeader.indexOf('attending');
      for (let i = 1; i < respRows.length; i++) {
        const key = responseKey(respRows[i][rIdxParty], respRows[i][rIdxName]);
        if (key === '|') continue;
        responded[key] = {
          meal: rIdxMeal > -1 ? String(respRows[i][rIdxMeal] || '').trim() : '',
          attending: rIdxAttending > -1 ? String(respRows[i][rIdxAttending] || '').trim() : '',
        };
      }
    }
  }

  const adultsYes = [], adultsNo = [], kidsYes = [], kidsNo = [];
  const adultsPending = [], kidsPending = [];

  invited.forEach(person => {
    const response = responded[person.key];

    if (!response) {
      // Not yet responded: go by the Guests sheet's static status.
      // "Maybe" counts as adult until they actually respond.
      (person.kidStatus === 'yes' ? kidsPending : adultsPending).push(person.name);
      return;
    }

    // Responded: go by what they actually picked, not their static status —
    // this is what correctly handles "Maybe" guests either way.
    const isKidResponse = response.meal === KIDS_MEAL_LABEL;
    const attendingYes = response.attending === 'Joyfully accepts';
    const bucket = isKidResponse
      ? (attendingYes ? kidsYes : kidsNo)
      : (attendingYes ? adultsYes : adultsNo);
    bucket.push(person.name);
  });

  let totalsSheet = ss.getSheetByName(TOTALS_SHEET);
  if (!totalsSheet) totalsSheet = ss.insertSheet(TOTALS_SHEET);

  const list = names => names.slice().sort().join(', ');

  const rows = [
    ['Metric', 'Count', 'Names'],
    ['Adults — Yes', adultsYes.length, list(adultsYes)],
    ['Adults — No', adultsNo.length, list(adultsNo)],
    ['Kids — Yes', kidsYes.length, list(kidsYes)],
    ['Kids — No', kidsNo.length, list(kidsNo)],
    ['Adults — Not yet responded', adultsPending.length, list(adultsPending)],
    ['Kids — Not yet responded', kidsPending.length, list(kidsPending)],
    ['Last updated', new Date(), ''],
  ];
  totalsSheet.getRange(1, 1, rows.length, 3).setValues(rows);
}
