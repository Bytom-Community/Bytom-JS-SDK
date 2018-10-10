function accountsApi(http) {
    this.http = http;
}

/**
 * Create a new account.
 * 
 * @see https://github.com/Bytom/bytom/wiki/API-Reference#create-account
 * 
 * @param {Array of String} xpubs - root_xpubs, pubkey array.
 * @param {Integer} quorum - The number of keys required to sign transactions for the account.
 * @param {String} alias  - Account alias.
 */
accountsApi.prototype.create = function(xpubs, quorum, alias) {
    return this.http.request('/create-account', {root_xpubs: xpubs, quorum, alias});
};

/**
 * List all accounts in the target Bytom node.
 */
accountsApi.prototype.listAll = function() {
    return this.http.request('/list-accounts', {});
};

/**
 * List all addresses for one account.
 * 
 * @param {String} accountId - id of account.
 */
accountsApi.prototype.listAddressesById = function(accountId) {
    return this.http.request('/list-addresses', {account_id: accountId});
};

/**
 * List all addresses for one account.
 * 
 * @param {String} accountAlias - alias of account.
 */
accountsApi.prototype.listAddressesByAlias = function(accountAlias) {
    return this.http.request('/list-addresses', {account_alias: accountAlias});
};

export default accountsApi;