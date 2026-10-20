/** @OnlyCurrentDoc */ // asks Google for access to this spreadsheet only, not all your sheets

/**
 * Sheets to Calendar: turn each row into a Google Calendar event, and keep it in sync.
 *
 * Setup: header row with "Title" and "Start" columns. Optional: "End", "Description",
 * "Location", "Guests" (comma-separated emails). A "Calendar Event" column is created
 * to remember each row's event, so edits update the same event instead of duplicating it.
 * A Start with no time (e.g. 10/24/2026) makes an all-day event.
 */

const CALENDAR_ID = 'primary'; // or a calendar's ID from its Google Calendar settings
const EVENT_COL = 'Calendar Event';
const DEFAULT_MINUTES = 60;    // length of timed events with no End

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🗓️ Calendar')
    .addItem('Sync to Calendar', 'syncMenu')
    .addItem('Turn On Hourly Sync', 'turnOn')
    .addItem('Turn Off Hourly Sync', 'turnOff')
    .addToUi();
}

function syncMenu() {
  const r = sync_(SpreadsheetApp.getActiveSheet());
  SpreadsheetApp.getUi().alert(r.error || ('Created ' + r.created + ', updated ' + r.updated + ', unchanged ' + r.same + '.' +
    (r.failed ? ' ' + r.failed + ' row(s) failed; see the ' + EVENT_COL + ' column.' : '')));
}

function turnOn() {
  PropertiesService.getDocumentProperties().setProperty('sheetName', SpreadsheetApp.getActiveSheet().getName());
  turnOffQuietly_();
  ScriptApp.newTrigger('syncScheduled').timeBased().everyHours(1).create();
  syncMenu();
}

function turnOff() {
  turnOffQuietly_();
  SpreadsheetApp.getUi().alert('Hourly sync is off.');
}

function syncScheduled() {
  const name = PropertiesService.getDocumentProperties().getProperty('sheetName');
  const sheet = name && SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (sheet) sync_(sheet);
}

function sync_(sheet) {
  const cal = CalendarApp.getCalendarById(CALENDAR_ID);
  if (!cal) return { error: 'Calendar "' + CALENDAR_ID + '" not found. Check CALENDAR_ID at the top of the script.' };
  const range = sheet.getDataRange();
  const values = range.getValues();
  const shown = range.getDisplayValues();
  const headers = shown[0].map(h => h.trim());
  const col = name => headers.indexOf(name);
  if (col('Title') === -1 || col('Start') === -1) return { error: 'Row 1 needs "Title" and "Start" columns.' };
  let eventIdx = col(EVENT_COL);
  if (eventIdx === -1) {
    eventIdx = headers.length;
    sheet.getRange(1, eventIdx + 1).setValue(EVENT_COL);
  }

  const res = { created: 0, updated: 0, same: 0, failed: 0 };
  for (let r = 1; r < values.length; r++) {
    const get = name => col(name) === -1 ? '' : values[r][col(name)];
    const title = String(get('Title')).trim();
    if (!title || !(get('Start') instanceof Date)) continue;
    const cell = sheet.getRange(r + 1, eventIdx + 1);
    try {
      const when = timing_(get('Start'), shown[r][col('Start')], get('End'), col('End') === -1 ? '' : shown[r][col('End')]);
      const opts = {
        description: String(get('Description')),
        location: String(get('Location')),
        guests: String(get('Guests')),
      };
      const id = String(shown[r][eventIdx] || '').replace(/^ERROR.*/, '');
      const ev = id && findEvent_(cal, id);
      if (!ev) {
        const made = when.allDay
          ? cal.createAllDayEvent(title, when.start, when.end, opts)
          : cal.createEvent(title, when.start, when.end, opts);
        cell.setValue(made.getId());
        res.created++;
      } else if (update_(ev, title, when, opts)) {
        res.updated++;
      } else {
        res.same++;
      }
    } catch (e) {
      cell.setValue('ERROR: ' + e.message);
      res.failed++;
    }
  }
  return res;
}

/** Start/end for a row. A Start shown without a time means all-day; end is exclusive for all-day events. */
function timing_(start, startShown, end, endShown) {
  const allDay = !/\d:\d\d/.test(startShown);
  if (allDay) {
    const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const e = end instanceof Date ? new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1) : new Date(s.getTime() + 86400000);
    return { allDay, start: s, end: e > s ? e : new Date(s.getTime() + 86400000) };
  }
  let e = end instanceof Date ? end : null;
  if (e && !/\d:\d\d/.test(endShown)) e = null; // a date-only End on a timed event is ignored
  if (!e || e <= start) e = new Date(start.getTime() + DEFAULT_MINUTES * 60000);
  return { allDay, start, end: e };
}

function findEvent_(cal, id) {
  try {
    return cal.getEventById(id); // null if it was deleted in Calendar: make it again
  } catch (e) {
    return null;
  }
}

/** Apply any changed fields; returns true if something changed. */
function update_(ev, title, when, opts) {
  let changed = false;
  if (ev.getTitle() !== title) { ev.setTitle(title); changed = true; }
  if (ev.getDescription() !== opts.description) { ev.setDescription(opts.description); changed = true; }
  if (ev.getLocation() !== opts.location) { ev.setLocation(opts.location); changed = true; }
  const sameTime = ev.isAllDayEvent() === when.allDay &&
    ev.getStartTime().getTime() === when.start.getTime() && ev.getEndTime().getTime() === when.end.getTime();
  if (!sameTime) {
    if (when.allDay) ev.setAllDayDates(when.start, when.end);
    else ev.setTime(when.start, when.end);
    changed = true;
  }
  const want = opts.guests.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  const have = ev.getGuestList().map(g => g.getEmail().toLowerCase());
  want.filter(g => !have.includes(g)).forEach(g => { ev.addGuest(g); changed = true; });
  return changed;
}

function turnOffQuietly_() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'syncScheduled')
    .forEach(t => ScriptApp.deleteTrigger(t));
}
