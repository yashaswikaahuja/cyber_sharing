# CyberCafe Document Workflow Automation

Automates file handling for a cybercafe using Google Forms, Sheets, Drive, and Apps Script.

## What it does

- Customer submits a Google Form with name, phone, service type, and file upload
- Script auto-generates a token (101, 102, …), renames the file as `Token_Name_Service.ext`
- File is moved into `CyberCafe/YYYY/MM-MonthName/DD/Pending/` on Google Drive
- Sheet row is created with token, file link, status, and timestamp
- When operator changes Status to `Completed`, file moves to the `Completed/` folder automatically

## Files

| File       | Purpose                              |
|------------|--------------------------------------|
| `Code.gs`  | Full Apps Script automation code     |
| `SETUP.md` | Step-by-step setup and configuration |

## Quick Start

See [SETUP.md](SETUP.md) for full instructions.

1. Create Google Form with fields: Name, Phone Number, Service, File Upload
2. Link form to a Google Sheet
3. Paste `Code.gs` into Extensions → Apps Script
4. Run `installTriggers()` once to activate

## Drive Structure

```
CyberCafe/
└── 2026/
    └── 04-April/
        └── 26/
            ├── Pending/
            │   └── 101_Rahul_Print.pdf
            └── Completed/
```
