
/**
 * transactions api
 * 
 * @param {Object} http 
 */
function transactionsApi(http) {
    this.http = http;
}

/**
 * List all local transactions by account id.
 * 
 * @see https://github.com/Bytom/bytom/wiki/API-Reference#list-transactions
 * 
 * @param {String} accountId - Account id.
 */
transactionsApi.prototype.listByAccountId = function(accountId) {
    return this.http.request('/list-transactions', {account_id: accountId});
};

/**
 * List local transactions by id.
 * 
 * @see https://github.com/Bytom/bytom/wiki/API-Reference#list-transactions
 * 
 * @param {String} id - The transaction id.
 */
transactionsApi.prototype.listById = function(id) {
    return this.http.request('/list-transactions', {id});
};

/**
 * Build transaction.
 * 
 * @see https://github.com/Bytom/bytom/wiki/API-Reference#build-transaction
 * 
 * @param {String} baseTransaction - base data for the transaction, default is null.
 * @param {Object} actions - Set of actions to compose the transaction.
 * @param {Integer} timeRange - time stamp(block height)is maximum survival time for the transaction, the transaction will be not submit into block after this time stamp.
 * @param {Integer} ttl - integer of the time to live in milliseconds, it means utxo will be reserved(locked) for builded transaction in this time range, if the transaction will not to be submitted into block, it will be auto unlocked for build transaction again after this ttl time. it will be set to 5 minutes(300 seconds) defaultly when ttl is 0.
 */
transactionsApi.prototype.build = function(baseTransaction, actions, timeRange, ttl) {
    return this.http.request('/build-transaction', {
        base_transaction: baseTransaction,
        time_range: timeRange,
        actions,
        ttl
    });
};

/**
 * Sign transaction.
 * 
 * @see https://github.com/Bytom/bytom/wiki/API-Reference#sign-transaction
 * 
 * @param {Object} transaction - The built transaction template.
 * @param {String} password - signature of the password.
 */
transactionsApi.prototype.sign = function(transaction, password) {
    return this.http.request("/sign-transaction", {transaction, password});
};

/**
 * Submit a signed transaction to the blockchain.
 * 
 * @see https://github.com/Bytom/bytom/wiki/API-Reference#submit-transaction·
 * 
 * @param {String} rawTransaction - raw_transaction of signed transaction.
 */
transactionsApi.prototype.submit = function(rawTransaction) {
    return this.http.request("/submit-transaction", {raw_transaction: rawTransaction});
};

/**
 * Estimate consumed neu(1BTM = 10^8NEU) for the transaction.
 * 
 * @see https://github.com/Bytom/bytom/wiki/API-Reference#estimate-transaction-gas
 * 
 * @param {Object} transaction - builded transaction response.
 */
transactionsApi.prototype.estimateGas = function(transaction) {
    return this.http.request("estimate-transaction-gas", {transaction_template: transaction});
};

export default transactionsApi;