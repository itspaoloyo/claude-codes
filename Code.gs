// ============================================================
// Apartment Tracker — Google Apps Script
// ============================================================
// SETUP:
//   1. Open your Google Sheet → Extensions > Apps Script
//   2. Delete the default code and paste this entire file
//   3. Replace YOUR_SHEET_ID_HERE with your Sheet ID
//      (found in the URL: /spreadsheets/d/SHEET_ID/edit)
//   4. Deploy > New deployment > Web app
//      - Execute as: Me
//      - Who has access: Anyone
//   5. Copy the deployed URL into apartment-tracker.html (GAS_URL)
//
// After editing this script, create a NEW deployment to pick up changes.
// ============================================================

var SHEET_ID   = '1uJ4VUaHRfxb2DhQJg_mqs7K92Y_KTHfkHpbwCo57iO0';
var SHEET_NAME = 'Apartments';

var COLUMNS = [
  'Apartment Name',
  'Floor Plan Name',
  '$/mo',
  'Address',
  'Phone',
  'Status',
  'Tour Date',
  'Tour Time',
  'W/D in unit',
  'Parking included',
  'Carpet floors',
  'Pool',
  'Gym',
  'Dishwasher',
  'Power included',
  'Balcony/patio',
  'Pet friendly',
  'Storage',
  'WiFi included',
  'URL',
  'Notes'
];

// Called when the HTML form submits data (POST request)
function doPost(e) {
  try {
    var p = e.parameter;

    var row = [
      p.apartmentName   || '',
      p.floorPlanName   || '',
      p.pricePerMonth   || '',
      p.address         || '',
      p.phone           || '',
      p.status          || 'No call yet',
      p.tourDate        || '',
      p.tourTime        || '',
      p.washerDryer     || 'No',
      p.parkingIncluded || 'No',
      p.carpet          || 'No',
      p.pool            || 'No',
      p.gym             || 'No',
      p.dishwasher      || 'No',
      p.powerIncluded   || 'No',
      p.balcony         || 'No',
      p.petFriendly     || 'No',
      p.storage         || 'No',
      p.wifiIncluded    || 'No',
      p.url             || '',
      p.notes           || ''
    ];

    var ss    = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

    if (p.action === 'delete') {
      var rowNum = parseInt(p.sheetRow);
      sheet.deleteRow(rowNum);
    } else if (p.sheetRow) {
      var rowNum = parseInt(p.sheetRow);
      sheet.getRange(rowNum, 1, 1, COLUMNS.length).setValues([row]);
    } else {
      sheet.appendRow(row);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Called when the "View Apartments" tab fetches data (GET request)
// Maps by position using COLUMNS — immune to whatever is in the header row.
function doGet(e) {
  try {
    var ss    = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    var data  = sheet.getDataRange().getValues();

    // Skip first 3 rows (category/header rows), map data rows positionally to COLUMNS.
    // _row stores the 1-based sheet row number so edits can target the right row.
    var rows = [];
    for (var i = 3; i < data.length; i++) {
      var rowArr = data[i];
      if (!rowArr.some(function(cell) { return String(cell).trim() !== ''; })) continue;
      var obj = { _row: i + 1 };
      COLUMNS.forEach(function(col, j) {
        obj[col] = rowArr[j] !== undefined ? String(rowArr[j]) : '';
      });
      rows.push(obj);
    }

    if (rows.length === 0) {
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'success', rows: [] }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success', rows: rows }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Deletes all data rows (keeps the header). Run once to clear bad/old data.
function clearData() {
  var ss    = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) { Logger.log('Sheet not found.'); return; }
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) { Logger.log('No data rows to clear.'); return; }
  sheet.deleteRows(2, lastRow - 1);
  Logger.log('Cleared ' + (lastRow - 1) + ' data row(s). Header kept.');
}

// Fixes the header row to match the current COLUMNS list.
// Run this once in the GAS editor whenever columns change.
function resetHeaders() {
  var ss    = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(COLUMNS);
    Logger.log('Sheet was empty — headers created.');
  } else {
    sheet.getRange(1, 1, 1, COLUMNS.length).setValues([COLUMNS]);
    Logger.log('Header row updated to: ' + COLUMNS.join(', '));
  }
}

// ---- Manual test helpers (run these in the GAS editor) ----

function testDoPost() {
  var fakeEvent = {
    parameter: {
      apartmentName:   'Test Apartment',
      floorPlanName:   '1BR/1BA',
      pricePerMonth:   '1800',
      address:         '123 Main St',
      phone:           '555-0100',
      status:          'Tour scheduled',
      tourDate:        '2026-05-01',
      tourTime:        '10:00',
      washerDryer:     'Yes',
      parkingIncluded: 'Yes',
      carpet:          'Not all',
      pool:            'Yes',
      gym:             'No',
      powerIncluded:   'No',
      balcony:         'Yes',
      petFriendly:     'No',
      wifiIncluded:    'No',
      url:             'https://example.com',
      notes:           'Test entry from GAS editor'
    }
  };
  Logger.log(doPost(fakeEvent).getContent());
}

function testDoGet() {
  var result = doGet({});
  Logger.log(result.getContent());
}
