// Self-check for all-day vs timed event rules: node test.js
const vm = require('vm'), fs = require('fs'), assert = require('assert');
const ctx = { Date }; vm.runInNewContext(fs.readFileSync(__dirname + '/Code.gs', 'utf8'), ctx);
const d = (...a) => new Date(...a), iso = x => x.toISOString();
let t = ctx.timing_(d(2026, 9, 24), '10/24/2026', '', '');            // all-day, one day
assert.equal(t.allDay, true); assert.equal(iso(t.end), iso(d(2026, 9, 25)));
t = ctx.timing_(d(2026, 9, 24), '10/24/2026', d(2026, 9, 26), '10/26/2026'); // all-day, 3 days, end exclusive
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
