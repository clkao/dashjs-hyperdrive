class XHRHeaders {
    constructor() {
        this._headers = {};
    }

    get headers() {
        return this._headers;
    }

    setRequestHeader(key, value) {
        this._headers[key] = value;
    }
}

export default XHRHeaders;