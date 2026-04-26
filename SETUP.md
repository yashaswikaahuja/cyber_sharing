# CyberCafe Automation — Setup Guide

## Prerequisites

- A Google account
- Access to Google Forms, Sheets, Drive, and Apps Script

---

## Step 1 — Create the Google Form

1. Go to [forms.google.com](https://forms.google.com) → **Blank form**
2. Add these fields **exactly** (names must match the script):

| Field label   | Type              | Options                              |
|---------------|-------------------|--------------------------------------|
| Name          | Short answer      | —                                    |
| Phone Number  | Short answer      | —                                    |
| Service       | Dropdown          | Print, Scan, Lamination, Form Fill   |
| File Upload   | File upload       | Allow any file type                  |

> ⚠️ Field labels are case-sensitive. They must match exactly.

---

## Step 2 — Link Form to Google Sheets

1. In the Form editor, click **Responses** tab → **Link to Sheets** (green icon)
2. Choose **Create a new spreadsheet** → name it `CyberCafe Responses`
3. Open the created sheet — this is your working spreadsheet

---

## Step 3 — Open Apps Script

1. In the Google Sheet, go to **Extensions → Apps Script**
2. Delete all existing code in `Code.gs`
3. Paste the full contents of `Code.gs` from this repo
4. Click **Save** (💾)

---

## Step 4 — Install Triggers

Run `installTriggers()` once to set up both triggers automatically:

1. In Apps Script editor, select function `installTriggers` from the dropdown
2. Click **▶ Run**
3. Grant permissions when prompted (Google will ask for Drive + Sheets access)
4. Check **Triggers** (⏰ icon in left sidebar) — you should see:
   - `onFormSubmit` — From spreadsheet — On form submit
   - `onEdit` — From spreadsheet — On edit

> You only need to run `installTriggers()` once. Re-running it is safe — it removes old triggers first.

---

## Step 5 — Verify Drive Folder

The script auto-creates `CyberCafe/` in your **My Drive** on first submission.  
No manual folder creation needed.

To find it after first use:  
**Google Drive → My Drive → CyberCafe → YYYY → MM-MonthName → DD → Pending/**

---

## Step 6 — Test the Setup

1. Open your Form → click the **eye icon** (preview) → submit a test entry with a file
2. Check the Sheet — a new row should appear with:
   - Token (101, 102, …)
   - Name, Phone, Service
   - File Link (clickable Drive URL)
   - Status = `Pending`
   - Timestamp
3. Check Drive → `CyberCafe/YYYY/MM-MMMM/DD/Pending/` — renamed file should be there

---

## Step 7 — Mark a Job as Completed

1. In the Sheet, find the row for a completed job
2. Click the **Status** cell (column F)
3. Change the value from `Pending` to `Completed`
4. The script automatically moves the file from `Pending/` → `Completed/` folder

---

## Sheet Column Reference

| Col | Header    | Set by        |
|-----|-----------|---------------|
| A   | Token     | Script        |
| B   | Name      | Form          |
| C   | Phone     | Form          |
| D   | Service   | Form          |
| E   | File Link | Script        |
| F   | Status    | Script/Manual |
| G   | Timestamp | Script        |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| File not renamed / moved | Check form field labels match exactly (case-sensitive) |
| Token not incrementing | Ensure column A header is `Token`; script reads from row 2 down |
| Trigger not firing | Re-run `installTriggers()`; check permissions were granted |
| "Completed" move not working | Ensure you type `Completed` exactly (capital C) in Status cell |
| File link is empty | Form's File Upload field must be enabled; check Drive permissions |

---

## Limitations & Edge Cases

- **Multiple file uploads**: Only the first uploaded file is processed per submission.
- **File extension**: Preserved from the original upload (e.g. `.pdf`, `.jpg`, `.docx`).
- **Timezone**: Uses the Apps Script project timezone. Set it under **Project Settings → Time zone**.
- **Token uniqueness**: Derived from the max token in the sheet. Safe for concurrent use as long as form submissions don't arrive within the same script execution window (< 1 second apart).
- **Drive quota**: Large files count against your Google Drive storage.
- **onEdit trigger**: Does not fire on programmatic edits — only manual cell edits by a user.
