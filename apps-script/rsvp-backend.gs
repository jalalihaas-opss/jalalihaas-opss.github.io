// Open the RSVP Google Sheet itself, then Extensions > Apps Script — this "binds"
// the script to that one document, which is what gets you the narrower "only this
// spreadsheet" permission instead of "all your Sheets". Before clicking Extensions,
// double-check the account switcher (top-right of Sheets) shows the account that
// owns this Sheet — the earlier "unable to open" error was a multi-account mixup,
// not a real problem with this approach. Paste this whole file in, then deploy as
// a Web App. This runs entirely on Google's servers — never in the site's repo.

const SITE_KEY = 'movid-rsvp-2027'; // must match RSVP_SITE_KEY in js/rsvp.js
const GUESTS_SHEET = 'Guests';
const RESPONSES_SHEET = 'Responses';
const NOTIFY_EMAIL = 'jalali.haas@gmail.com';

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

function submitResponse(body) {
  const partyId = body.partyId;
  const partyLabel = body.partyLabel || '';
  const partyAnswers = body.partyAnswers || {};
  const responses = body.responses || []; // [{ guestName, answers: { questionId: value } }]

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

  const now = new Date();
  const emailLines = [`New RSVP from ${partyLabel || partyId}`, ''];

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
    sheet.appendRow(row);

    emailLines.push(`${person.guestName}:`);
    Object.keys(merged).forEach(key => emailLines.push(`  ${key}: ${merged[key]}`));
    emailLines.push('');
  });

  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: `RSVP received — ${partyLabel || partyId}`,
    body: emailLines.join('\n'),
  });

  return { ok: true };
}
