import keysApi from './api/keys.js';
import accountsApi from './api/accounts.js';
import transactionsApi from './api/transactions.js';
import keysSDK from './sdk/keys.js';
import accountsSDK from './sdk/accounts.js';
import transactionSDK from './sdk/transaction.js';
import http from './http.js';

//todo vue use
function Bytom(serverHost, wasmPath, baseURL, token) {
    this.install = function(Vue) {
        Vue.prototype.$Bytom = this;
    };
    
    if(baseURL) {
        this.http = new http(baseURL, token);

        this.keys = new keysApi(this.http);
        this.accounts = new accountsApi(this.http);
        this.transactions = new transactionsApi(this.http);
    }

    Bytom.wasmPath = wasmPath;
    this.sdk = {};
    this.sdk.keys = new keysSDK();
    this.sdk.accounts = new accountsSDK();
    this.sdk.transaction = new transactionSDK();
}

export default Bytom;