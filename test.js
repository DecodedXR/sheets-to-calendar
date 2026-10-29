// Self-check for all-day vs timed event rules: node test.js
const vm = require('vm'), fs = require('fs'), assert = require('assert');
const LOCAL = Intl.DateTimeFormat().resolvedOptions().timeZone;
const ctx = { Date, Intl, Utilities: { formatDate: (dt, tz, p) => { assert.equal(p, 'yyyy-MM-dd'); return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(dt); } } }; vm.runInNewContext(fs.readFileSync(__dirname + '/Code.gs', 'utf8'), ctx);
const d = (...a) => new Date(...a), iso = x => x.toISOString();
let t = ctx.timing_(d(2026, 9, 24), '10/24/2026', '', '', LOCAL);     // all-day, one day
assert.equal(t.allDay, true); assert.equal(iso(t.end), iso(d(2026, 9, 25)));
t = ctx.timing_(d(2026, 9, 24), '10/24/2026', d(2026, 9, 26), '10/26/2026', LOCAL); // all-day, 3 days, end exclusive
assert.equal(iso(t.end), iso(d(2026, 9, 27)));
t = ctx.timing_(d(2026, 9, 24, 14), '10/24/2026 14:00:00', '', '');   // timed, default length
assert.equal(t.allDay, false); assert.equal(iso(t.end), iso(d(2026, 9, 24, 15)));
t = ctx.timing_(d(2026, 9, 24, 14), '10/24/2026 2:00 PM', d(2026, 9, 24, 16, 30), '10/24/2026 4:30 PM');
assert.equal(iso(t.end), iso(d(2026, 9, 24, 16, 30)));
t = ctx.timing_(d(2026, 9, 24, 14), '10/24/2026 2:00 PM', d(2026, 9, 24, 13), '10/24/2026 1:00 PM'); // end before start
assert.equal(iso(t.end), iso(d(2026, 9, 24, 15)));
t = ctx.timing_(d(2026, 9, 24, 14), '10/24/2026 2:00 PM', d(2026, 9, 25), '10/25/2026'); // date-only End ignored
assert.equal(iso(t.end), iso(d(2026, 9, 24, 15)));
console.log('ok');

// All-day dates are read in the spreadsheet's time zone. A sheet in Tokyo hands over Oct 24 as
// 2026-10-23T15:00Z; a script running further west must still make the event on Oct 24.
{
  process.env.TZ = 'America/Los_Angeles';
  const c = { Date, Intl, Utilities: { formatDate: (dt, tz, p) => { assert.equal(p, 'yyyy-MM-dd'); return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(dt); } } };
  vm.runInNewContext(fs.readFileSync(__dirname + '/Code.gs', 'utf8'), c);
  const tokyoMidnight = new Date('2026-10-23T15:00:00Z');
  const a = c.timing_(tokyoMidnight, '10/24/2026', '', '', 'Asia/Tokyo');
  assert.equal(a.start.getDate(), 24);
  assert.equal(a.end.getDate(), 25);
}

// A copied row carries its original's event ID: the top row keeps the event, the copy gets its own.
{
  const rows = [['Title', 'Start', 'Calendar Event'], ['Orig', new Date(2026, 9, 24), '']];
  const events = [];
  const mkEv = (title, s, e) => {
    const ev = { id: 'ev' + events.length, title, s, e, allDay: true, desc: '', loc: '',
      getId: () => ev.id, getTitle: () => ev.title, setTitle: v => { ev.title = v; }, getDescription: () => ev.desc,
      setDescription: v => { ev.desc = v; }, getLocation: () => ev.loc, setLocation: v => { ev.loc = v; },
      isAllDayEvent: () => ev.allDay, getStartTime: () => ev.s, getEndTime: () => ev.e,
      setAllDayDates: (a, b) => { ev.s = a; ev.e = b; }, setTime: (a, b) => { ev.s = a; ev.e = b; ev.allDay = false; },
      getGuestList: () => [], addGuest: () => {} };
    events.push(ev); return ev;
  };
  const cal = { createAllDayEvent: (t, s, e) => mkEv(t, s, e), createEvent: (t, s, e) => mkEv(t, s, e),
    getEventById: id => events.find(ev => ev.id === id) || null };
  const sheet = {
    getParent: () => ({ getSpreadsheetTimeZone: () => 'America/Los_Angeles' }),
    getDataRange: () => ({ getValues: () => rows.map(r => r.slice()),
      getDisplayValues: () => rows.map(r => r.map(v => v instanceof Date ? (v.getMonth() + 1) + '/' + v.getDate() + '/' + v.getFullYear() : String(v))) }),
    getRange: (r, c) => ({ setValue: v => { rows[r - 1][c - 1] = v; } }),
  };
  const c = { Date, Intl, CalendarApp: { getCalendarById: () => cal },
    Utilities: { formatDate: (dt, tz, p) => { assert.equal(p, 'yyyy-MM-dd'); return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(dt); } } };
  vm.runInNewContext(fs.readFileSync(__dirname + '/Code.gs', 'utf8'), c);
  c.sync_(sheet);
  rows.push(['Copy', new Date(2026, 10, 2), rows[1][2]]); // the user copies row 2, event ID and all, then edits it
  const r = c.sync_(sheet);
  assert.equal(r.created, 1);
  assert.equal(events[0].title, 'Orig');        // the original event wasn't overwritten by the copy
  assert.equal(events[0].s.getDate(), 24);
  assert.equal(rows[2][2], events[1].getId());
  assert.equal(events[1].title, 'Copy');
}
console.log('ok fixes');
