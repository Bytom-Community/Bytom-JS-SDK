import {signTransaction} from '../wasm/func';

function transactionSDK() {
}

/**
 * sign transaction
 *
 * @param {String} transaction
 * @param {String} password
 * @returns {Promise}
 */
transactionSDK.prototype.signTransaction = function(transaction, password) {
    let data = {transaction:transaction, password:password};
    let retPromise = new Promise((resolve, reject) => {
        signTransaction(data).then(res => {
            resolve(res.data);
        }).catch(err => {
            reject(err);
        });
    });
    return retPromise;
};

export default transactionSDK;