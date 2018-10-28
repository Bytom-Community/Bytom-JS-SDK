import { signTransaction1 } from '../wasm/func';
import { handleApiError, handleAxiosError } from '../utils/http';
import { getDB } from '../db/db';

function transactionSDK(bytom) {
    this.http = bytom.serverHttp;
    this.bytom = bytom;
}


/**
 * List all the transactions related to a wallet or an address.
 *
 * @see https://gist.github.com/HAOYUatHZ/0c7446b8f33e7cddd590256b3824b08f#apiv1btmmerchantlist-transactions
 * @param {String} guid unique id for each wallet
 * @param {String} address (optional) if provided, will only return transactions the address is related to
 * @param {Number} start page start
 * @param {Number} limit page limit
 * @returns {Promise}
 */
transactionSDK.prototype.list = function(guid, address, start, limit) {
    let net = this.bytom.net;
    let retPromise = new Promise((resolve, reject) => {
        let pm = {guid: guid};
        if (address) {
            pm.address = address;
        }
        let url = 'merchant/list-transactions';
        let args = new URLSearchParams();
        if (typeof start !== 'undefined') {
            args.append('start', start);
        }
        if (limit) {
            args.append('limit', limit);
        }
        url = url + '?' + args.toString();
        this.http.request(url, pm, net).then(resp => {
            resolve(resp.data);
        }).catch(err => {
            reject(handleAxiosError(err));
        });
    });
    return retPromise;
};

/**
 * Submit a signed transaction to the chain.
 *
 * @see https://gist.github.com/HAOYUatHZ/0c7446b8f33e7cddd590256b3824b08f#apiv1btmmerchantsubmit-payment
 * @param {String} guid unique id for each wallet
 * @param {String} raw_transaction raw transaction bytes encoded to string
 * @param {Array} signatures signed data of each signing instruction
 */
transactionSDK.prototype.submitPayment = function(guid, raw_transaction, signatures) {
    let net = this.bytom.net;
    let retPromise = new Promise((resolve, reject) => {
        let pm = {guid: guid, raw_transaction: raw_transaction, signatures: signatures};
        this.http.request('merchant/submit-payment', pm, net).then(resp => {
            if (resp.status !== 200) {
                reject(handleApiError(resp));
                return;
            }
            resolve(resp.data);
        }).catch(err => {
            reject(handleAxiosError(err));
        });
    });
    return retPromise;
};

/**
 * Build a raw transaction transfered from the wallet. 
 * May use all available addresses (under the wallet) as source addresses if not specified.
 * 
 * @see https://gist.github.com/HAOYUatHZ/0c7446b8f33e7cddd590256b3824b08f#apiv1btmmerchantbuild-payment
 * @param {String} guid unique id for each wallet
 * @param {String} to destination address
 * @param {String} asset hexdecimal asset id
 * @param {Number} amount transfer amount
 * @param {String} from source address
 * @param {Number} fee transaction fee amount
 * @returns {Promise}
 */
transactionSDK.prototype.buildPayment = function(guid, to, asset, amount, from, fee) {
    let net = this.bytom.net;
    let retPromise = new Promise((resolve, reject) => {
        let pm = {guid: guid, to: to, asset: asset, amount: amount};
        if (from) {
            pm.from = from;
        }
        if (fee) {
            pm.fee = fee;
        }
        this.http.request('merchant/build-payment', pm, net).then(resp => {
            if (resp.status !== 200) {
                reject(handleApiError(resp));
                return;
            }
            resolve(resp.data);
        }).catch(err => {
            reject(handleAxiosError(err));
        });
    });
    return retPromise;
};

/**
 * sign transaction
 * @param {String} guid
 * @param {String} transaction
 * @param {String} password
 * @returns {Object} signed data
 */
transactionSDK.prototype.signTransaction = function(guid, transaction, password) {
    let bytom = this.bytom;
    let retPromise = new Promise((resolve, reject) => {
        getDB().then(db => {
            let getRequest = db.transaction(['accounts-server'], 'readonly')
                .objectStore('accounts-server')
                .index('guid')
                .get(guid);
            getRequest.onsuccess = function(e) {
                if (!e.target.result) {
                    reject(new Error('not found guid'));
                    return;
                }
                bytom.sdk.keys.getKeyByXPub(e.target.result.rootXPub).then(res => {
                    let pm = {transaction: transaction, password: password, key: res};
                    signTransaction1(pm).then(res => {
                        resolve(JSON.parse(res.data));
                    }).catch(err => {
                        reject(err);
                    });
                }).catch(err => {
                    reject(err);
                });
            };
            getRequest.onerror = function() {
                reject(getRequest.error);
            };
        }).catch(error => {
            reject(error);
        });
    });
    return retPromise;
};

export default transactionSDK;