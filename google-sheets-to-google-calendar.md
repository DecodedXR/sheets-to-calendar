---
title: How to add Google Sheets rows to Google Calendar automatically (free)
description: Create Google Calendar events from a Google Sheet and keep them in sync when you edit rows. All-day or timed events, guests, hourly auto-sync. Free Apps Script, no add-on.
image: https://decodedxr.github.io/sheets-to-calendar/assets/cover.png
---
{% raw %}

# How to add Google Sheets rows to Google Calendar automatically (free)

Planning in a spreadsheet is fast. Retyping every row into Google Calendar isn't. This guide connects the two: each row becomes a calendar event, and when you change a date or title in the sheet, the event changes too. It's free, needs no add-on, and has no monthly event limit.

It uses [Sheets to Calendar](https://github.com/DecodedXR/sheets-to-calendar), a free, MIT-licensed Apps Script.

## Step 1: Set up the sheet

Put headers in **row 1**. Only **Title** and **Start** are required:

| Title | Start | End | Location | Description | Guests |
|---|---|---|---|---|---|
| Team offsite | 11/12/2026 | 11/13/2026 | Lake House | Agenda in the shared drive | |
| Client call: Northwind | 11/03/2026 14:00 | 11/03/2026 14:30 | Google Meet | Q4 review | ana@example.com |
| Publish blog post | 11/05/2026 | | | | |

- A **Start** with only a date makes an **all-day** event. **End** is the last day, so the offsite above covers two days.
- A **Start** with a time makes a **timed** event. Without an **End** time, it lasts an hour.
- **Guests** adds people to the event, separated by commas. Invitations aren't emailed.

Make sure the Start and End columns are real dates, not text: **Format → Number → Date** or **Date time**.

## Step 2: Add the script

1. In the sheet: **Extensions → Apps Script**.
2. Delete the placeholder code, paste in [`Code.gs`](https://github.com/DecodedXR/sheets-to-calendar/blob/main/Code.gs), and **Save**.
3. Reload the sheet. A **🗓️ Calendar** menu appears.

To add events to a calendar other than your main one, open that calendar's **Settings and sharing** in Google Calendar, copy its **Calendar ID** from the "Integrate calendar" section, and paste it into `CALENDAR_ID` at the top of the script.

## Step 3: Sync

Choose **🗓️ Calendar → Sync to Calendar**. Google asks for permission the first time ("Google hasn't verified this app" → **Advanced → Go to (your project name) → Allow**; it's your own script).

The events appear in Google Calendar, and a **Calendar Event** column now holds each row's event ID. That ID is how the script knows which event belongs to which row.

## Step 4: Edit and re-sync

Change a time, rename an event or add a guest in the sheet, then choose **Sync to Calendar** again. The existing events are updated, not duplicated, and unchanged rows are left alone.

For hands-off syncing, choose **🗓️ Calendar → Turn On Hourly Sync**. The sheet then pushes changes to Calendar every hour, even when it's closed.

## Common uses

- **Shift schedules:** one row per shift, the person in **Guests**.
- **Content calendars:** one row per post, with the draft link in **Description**.
- **Class or training timetables:** a row per session, with the room in **Location**.
- **Project milestones:** all-day events from a list of deadlines. To email people before each deadline as well, see [automatic reminders from Google Sheets](https://decodedxr.github.io/sheets-deadline-reminders/automatic-email-reminders-google-sheets.html).

## FAQ

**Is it free?** Yes, with no event limit. It runs on your own Google account under Google's normal Calendar quotas, which a personal schedule won't come close to.

**Does deleting a row delete the event?** No. That avoids losing events by accident. Delete the event in Calendar directly.

**I deleted an event in Calendar and it came back.** The row still exists, so the next sync recreated it. Delete the row (or clear its Start) to stop that.

**Times are off by a few hours.** Set the spreadsheet's time zone (**File → Settings**) to match your calendar's.

**How do I make a fresh copy of an event?** Clear that row's **Calendar Event** cell and sync again.

---

[Get the script on GitHub](https://github.com/DecodedXR/sheets-to-calendar) · Also free: [Mail Merge for Google Sheets](https://decodedxr.github.io/sheets-mail-merge/free-mail-merge-google-sheets.html) · [Deadline reminders from Google Sheets](https://decodedxr.github.io/sheets-deadline-reminders/automatic-email-reminders-google-sheets.html)
{% endraw %}
