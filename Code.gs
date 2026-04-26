// ============================================================
// CyberCafe Document Workflow Automation
// ============================================================

var ROOT_FOLDER_NAME = "CyberCafe";
var TOKEN_START = 101;

// ── Helpers ──────────────────────────────────────────────────

function getRootFolder() {
  var folders = DriveApp.getFoldersByName(ROOT_FOLDER_NAME);
  return folders.hasNext() ? folders.next() : DriveApp.createFolder(ROOT_FOLDER_NAME);
}

function getOrCreateFolder(parent, name) {
  var children = parent.getFoldersByName(name);
  return children.hasNext() ? children.next() : parent.createFolder(name);
}

/**
 * Builds:  CyberCafe / YYYY / MM-MonthName / DD / Pending
 * Returns the Pending folder for today.
 */
function getPendingFolder(date) {
  var year  = Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy");
  var month = Utilities.formatDate(date, Session.getScriptTimeZone(), "MM-MMMM");   // e.g. 04-April
  var day   = Utilities.formatDate(date, Session.getScriptTimeZone(), "dd");

  var root    = getRootFolder();
  var yFolder = getOrCreateFolder(root,    year);
  var mFolder = getOrCreateFolder(yFolder, month);
  var dFolder = getOrCreateFolder(mFolder, day);
  return getOrCreateFolder(dFolder, "Pending");
}

/**
 * Returns the Completed folder for a given date string "yyyy/MM-MMMM/dd".
 * Creates it if missing.
 */
function getCompletedFolder(dateStr) {
  var parts   = dateStr.split("/");          // ["2026","04-April","26"]
  var root    = getRootFolder();
  var yFolder = getOrCreateFolder(root,    parts[0]);
  var mFolder = getOrCreateFolder(yFolder, parts[1]);
  var dFolder = getOrCreateFolder(mFolder, parts[2]);
  return getOrCreateFolder(dFolder, "Completed");
}

/**
 * Next token = max existing token in column A (skipping header) + 1,
 * or TOKEN_START if sheet is empty.
 */
function getNextToken(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return TOKEN_START;

  var tokens = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  var max = TOKEN_START - 1;
  tokens.forEach(function(row) {
    var v = parseInt(row[0], 10);
    if (!isNaN(v) && v > max) max = v;
  });
  return max + 1;
}

// ── Main trigger ─────────────────────────────────────────────

function onFormSubmit(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  // Ensure header row exists
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Token", "Name", "Phone", "Service", "File Link", "Status", "Timestamp"]);
  }

  var responses = e.namedValues;
  var name      = (responses["Name"]         || [""])[0].trim();
  var phone     = (responses["Phone Number"] || [""])[0].trim();
  var service   = (responses["Service"]      || [""])[0].trim();

  // Uploaded file IDs come as a comma-separated string in namedValues
  var fileIds   = (responses["File Upload"]  || [""])[0].split(",").map(function(s){ return s.trim(); }).filter(Boolean);

  var token     = getNextToken(sheet);
  var now       = new Date();
  var timestamp = Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
  var pending   = getPendingFolder(now);

  var fileLink = "";

  if (fileIds.length > 0) {
    var fileId   = fileIds[0];                          // handle first uploaded file
    var file     = DriveApp.getFileById(fileId);
    var ext      = file.getName().split(".").pop();     // preserve original extension
    var newName  = token + "_" + name + "_" + service + "." + ext;

    file.setName(newName);
    pending.addFile(file);
    DriveApp.getRootFolder().removeFile(file);          // remove from My Drive root

    fileLink = file.getUrl();
  }

  sheet.appendRow([token, name, phone, service, fileLink, "Pending", timestamp]);
}

// ── Status change: Pending → Completed ───────────────────────

/**
 * Called by onEdit trigger.
 * When Status column (col 6) changes to "Completed",
 * moves the file from Pending/ to Completed/ folder.
 */
function onEdit(e) {
  var range  = e.range;
  var sheet  = range.getSheet();
  var col    = range.getColumn();
  var row    = range.getRow();

  // Column 6 = Status, skip header
  if (col !== 6 || row < 2) return;
  if (range.getValue() !== "Completed") return;

  var rowData  = sheet.getRange(row, 1, 1, 7).getValues()[0];
  var fileLink = rowData[4];   // col E = File Link
  if (!fileLink) return;

  // Extract file ID from Drive URL
  var match = fileLink.match(/[-\w]{25,}/);
  if (!match) return;

  var fileId = match[0];
  var file;
  try { file = DriveApp.getFileById(fileId); }
  catch(err) { return; }   // file not found or no access

  // Determine date from Timestamp (col G)
  var ts = rowData[6];
  var date = ts ? new Date(ts) : new Date();
  var tz   = Session.getScriptTimeZone();
  var dateStr = Utilities.formatDate(date, tz, "yyyy") + "/" +
                Utilities.formatDate(date, tz, "MM-MMMM") + "/" +
                Utilities.formatDate(date, tz, "dd");

  var completedFolder = getCompletedFolder(dateStr);
  var pendingFolder   = getPendingFolder(date);

  completedFolder.addFile(file);
  try { pendingFolder.removeFile(file); } catch(err) {}
}

// ── One-time setup: install triggers programmatically ────────

function installTriggers() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Remove existing triggers to avoid duplicates
  ScriptApp.getProjectTriggers().forEach(function(t) { ScriptApp.deleteTrigger(t); });

  // Form-submit trigger (fires when linked form is submitted)
  ScriptApp.newTrigger("onFormSubmit")
    .forSpreadsheet(ss)
    .onFormSubmit()
    .create();

  // onEdit trigger for status changes
  ScriptApp.newTrigger("onEdit")
    .forSpreadsheet(ss)
    .onEdit()
    .create();

  Logger.log("Triggers installed successfully.");
}
