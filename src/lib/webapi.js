let webapi = {};

webapi.get = (e) => {
    let fields = webapi._parseFields(e);
    fields['method'] = 'select';
    let result = database.query(fields);
    return webapi._createResponse(result);
};

webapi.post = (e) => {
    let fields = webapi._parseFields(e);
    let result = database.query(fields);
    return webapi._createResponse(result);
};

webapi._parseFields = (e) => {
    let fields = {
        'table': '',
        'method': 'select',
        'url_params': {},
        'payload': {}
    };

    for (let key in e.parameter) {
        switch (key) {
            case 'table':
                fields['table'] = e.parameter['table'];
                break;
            case 'method':
                fields['method'] = e.parameter['method'].toLowerCase();
                break;
            default:
                fields['url_params'][key] = e.parameter[key];
        }
    }
    if (e.postData) {
        fields['payload'] = JSON.parse(e.postData.contents);
    }

    return fields;
};

webapi._createResponse = (param) => {
    let resp = ContentService.createTextOutput();
    resp.setMimeType(ContentService.MimeType.JSON);
    resp.setContent(JSON.stringify(param));
    return resp;
};
