const database = {};

database.query = (params) => {
  let resp = {
    status_code: 200,
    message: 'OK'
  };
  let lock = LockService.getDocumentLock();
  let lock_timeout_ms = 30000;

  try {
    lock.waitLock(lock_timeout_ms);
    database._init(params);
    if (!database._queryMethod[params['method']]) {
      throw Error('Unknown method type.')
    }
    result = database._queryMethod[params['method']]();
    resp = { ...resp, ...result };
  } catch (e) {
    resp['status_code'] = 400;
    resp['message'] = e.message;
  } finally {
    SpreadsheetApp.flush();
    lock.releaseLock();
  }

  return resp;
};

database._init = function (params) {
  database._params = params;
  database._queryMethod = {
    'select': database._select,
    'update': database._update,
    'insert': database._insert,
    'delete': database._delete
  };

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  database._sheet = spreadsheet.getSheetByName(params['table']);
  if (!database._sheet) {
    throw Error('No table exists.')
  }
  database._dataRange = database._sheet.getDataRange();
  database._NUM_ROWS = database._dataRange.getNumRows();
  database._NUM_COLUMNS = database._dataRange.getNumColumns();
  database._labels = database._sheet.getRange(1, 1, 1, database._NUM_COLUMNS).getValues()[0];
  database._filter = null;

  return true;
};

database._isSelectedRecord = (values) => {
  for (let key in database._params['url_params']) {
    let col = database._labels.indexOf(key)
    let queryValue = database._params['url_params'][key];
    if ((col != -1) && (values[col] != queryValue)) {
      return false;
    }
  }
  return true;
};

database._select = () => {
  let result = {
    'record': []
  };

  range = database._sheet.getRange(2, 1, database._NUM_ROWS - 1, database._NUM_COLUMNS);
  range.getValues().forEach((values) => {
    if (database._isSelectedRecord(values)) {
      record = {};
      values.forEach((val, col) => {
        let key = database._labels[col];
        record[key] = val;
      });
      result['record'].push(record);
    }
  });

  return result;
};

database._update = () => {
  let result = {};

  range = database._sheet.getRange(2, 1, database._NUM_ROWS - 1, database._NUM_COLUMNS);
  range.getValues().forEach((values, row) => {
    if (database._isSelectedRecord(values)) {
      for (let key in database._params['payload']) {
        col = database._labels.indexOf(key);
        if (col != -1) {
          values[col] = database._params['payload'][key];
        }
      }
      database._sheet.getRange(row + 2, 1, 1, database._NUM_COLUMNS).setValues([values]);
    }
  });
  return result;
}

database._insert = () => {
  let result = {};

  let values = Array(database._NUM_COLUMNS);
  for (let key in payload) {
    let col = database._labels.indexOf(key);
    if (col == -1) return;
    values[col] = database._params['payload'][key];
  }
  database._sheet.appendRow(values);
  return result;
};

database._delete = () => {
  let result = {};

  range = database._sheet.getRange(2, 1, database._NUM_ROWS - 1, database._NUM_COLUMNS);
  range.getValues().reverse().forEach((values, row) => {
    if (database._isSelectedRecord(values)) {
      database._sheet.deleteRow(database._NUM_ROWS - row);
    }
  });

  return result;
};
