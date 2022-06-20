function log(text) {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName('log');
    sheet.appendRow([text]);
}
