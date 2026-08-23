// A separate, minimal Sheet + Apps Script just for the site password — kept apart
// from the RSVP Sheet so you can ever share the guest list/responses (with a
// planner, Navid's family, whoever) without also handing over the site password.
//
// Setup:
// 1. Create a new Google Sheet, name it something like "Movid Site Config".
// 2. Rename its first tab to "Config" and add two columns: Key | Value.
//    Add one row: Password | <whatever you want the site password to be>
// 3. Open that Sheet, Extensions > Apps Script, paste this whole file in.
// 4. Deploy > New deployment > Web app > Execute as: Me > Who has access: Anyone.
// 5. Copy the /exec URL it gives you and send it over — it goes in js/config.js
//    as GATE_ENDPOINT (base64-encoded there, same as the RSVP endpoint).

const SITE_KEY = 'movid-rsvp-2027'; // must match SITE_KEY in js/config.js
const CONFIG_SHEET = 'Config';

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
    const key = params.key || body.key;

    if (key !== SITE_KEY) {
      return json({ error: 'unauthorized' });
    }

    const action = params.action || body.action;
    if (action === 'checkPassword') {
      return json(checkPassword(params.password || body.password || ''));
    }
    return json({ error: 'unknown action' });
  } catch (err) {
    return json({ error: String(err) });
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

// Reads the "Password" row from the Config tab (Key | Value columns) and
// compares it, case-insensitively, against what the visitor typed. The real
// password never ships to the browser — only this yes/no result does.
function checkPassword(password) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG_SHEET);
  if (!sheet) return { ok: false };

  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (normalize(rows[i][0]) === 'password') {
      const stored = normalize(rows[i][1]);
      return { ok: stored !== '' && stored === normalize(password) };
    }
  }
  return { ok: false };
}
