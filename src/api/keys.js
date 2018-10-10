function keysApi(http) {
    this.http = http;
}

/**
 * Create a new key.
 * 
 * @param {String} alias - User specified, unique identifier.
 * @param {String} password - User specified, key password.
 */
keysApi.prototype.create = function(alias, password) {
    return this.http.request('/create-key', {alias, password});
};

export default keysApi;