
/**
 * balances Api
 */
function balancesApi(http) {
    this.http = http;
}

/**
 * get balances list
 */
balancesApi.prototype.list =function() {
    return this.http.request('/list-balances', {});
};