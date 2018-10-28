import {getDB} from '../db/db';
import {createAccount, createAccountReceiver} from '../wasm/func';
import {handleApiError, handleAxiosError} from '../utils/http';
function accountsSDK(bytom){
    this.http = bytom.serverHttp;
    this.bytom = bytom;
}

/**
 * List of the account.
 *
 * @returns {Promise}
 */
accountsSDK.prototype.listAccountUseServer = function() {
    let net = this.bytom.net;
    let retPromise = new Promise((resolve, reject) => {
        getDB().then(db => {
            let transaction = db.transaction(['accounts-server'], 'readonly');
            let objectStore = transaction.objectStore('accounts-server').index('net');
            let keyRange = IDBKeyRange.only(net);
            let oc = objectStore.openCursor(keyRange);
            let ret = [];
            oc.onsuccess = function (event) {
                var cursor = event.target.result;
                if (cursor) {
                    ret.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(ret);
                }
            };
            oc.onerror = function(e){
                reject(e);
            };
        }).catch(error => {
            reject(error);
        });
    });
    return retPromise;
};


/**
 * List all addresses and the corresponding balances of a wallet.
 *
 * @see https://gist.github.com/HAOYUatHZ/0c7446b8f33e7cddd590256b3824b08f#apiv1btmaccountlist-addresses
 * @param {String} guid
 * @returns
 */
accountsSDK.prototype.listAddressUseServer = function(guid) {
    let net = this.bytom.net;
    let retPromise = new Promise((resolve, reject) => {
        this.http.request('account/list-addresses', {guid:guid}, net).then(resp => {
            resolve(resp.data.data.addresses);
        }).catch(error => {
            reject(handleAxiosError(error));
        });
    });
    return retPromise;
};
/**
 * Create a new address for a wallet.
 *
 * @see https://gist.github.com/HAOYUatHZ/0c7446b8f33e7cddd590256b3824b08f#apiv1btmaccountnew-address
 * @param {String} guid unique id for each wallet
 * @param {String} label alias for the address to be created
 * @returns {Promise}
 */
accountsSDK.prototype.createAccountReceiverUseServer = function(guid, label) {
    let net = this.bytom.net;
    let retPromise = new Promise((resolve, reject) => {
        let pm = {guid: guid};
        if (label) {
            pm.label = label;
        }
        this.http.request('account/new-address', pm, net).then(resp => {
            if (resp.status !== 200) {
                reject(handleApiError(resp));
                return;
            }
            let dbData = resp.data.data;
            dbData.guid = guid;
            dbData.net = net;
            getDB().then(db => {
                let transaction = db.transaction(['addresses-server'], 'readwrite');
                let objectStore = transaction.objectStore('addresses-server');
                delete dbData.rootXPub;
                let request = objectStore.add(dbData);
                request.onsuccess = function() {
                    resolve(dbData);
                };
                request.onerror = function() {
                    reject(request.error);
                };
            });
        }).catch(error => {
            reject(handleAxiosError(error));
        });
    });
    return retPromise;
};

/**
 * Create a wallet using a public key. Each wallet is identified by a guid. (by server)
 * 
 * @see https://gist.github.com/HAOYUatHZ/0c7446b8f33e7cddd590256b3824b08f#endpoints
 * @param {String} rootXPub
 * @param {String} alias alias for the account
 * @param {String} label alias for the first address
 * @returns {Promise}
 */
accountsSDK.prototype.createAccountUseServer = function(rootXPub, alias, label) {
    let net = this.bytom.net;
    let that = this;
    let retPromise = new Promise((resolve, reject) => {
        getDB().then(db => {
            let getRequest = db.transaction(['accounts-server'], 'readonly')
                .objectStore('accounts-server')
                .index('alias')
                .get(alias);
            getRequest.onsuccess = function(e) {
                if (e.target.result) {
                    reject(new Error('duplicate account alias'));
                    return;
                }
                let pm = {pubkey: rootXPub};
                if (label) {
                    pm.label = label;
                }
                that.http.request('account/create', pm, net).then(resp => {
                    if (resp.status !== 200) {
                        reject(handleApiError(resp));
                        return;
                    }
                    let dbData = resp.data.data;
                    dbData.rootXPub = rootXPub;
                    dbData.alias = alias;
                    dbData.net = net;
                    getDB().then(db => {
                        let transaction = db.transaction(['accounts-server'], 'readwrite');
                        let objectStore = transaction.objectStore('accounts-server');
                        let request = objectStore.add(dbData);
                        request.onsuccess = function() {
                            let transaction = db.transaction(['addresses-server'], 'readwrite');
                            let objectStore = transaction.objectStore('addresses-server');
                            delete dbData.rootXPub;
                            let request = objectStore.add(dbData);
                            request.onsuccess = function() {
                                resolve(dbData);
                            };
                            request.onerror = function() {
                                reject(request.error);
                            };
                        };
                        request.onerror = function() {
                            reject(request.error);
                        };
                    });
                }).catch(error => {
                    reject(handleAxiosError(error));
                });
            };
            getRequest.onerror = function() {
                reject(getRequest.error);
            };
        }).catch(err => {
            reject(err);
        });
    });
    return retPromise;
};

/**
 * create account
 * 
 * @param {String} alias 
 * @param {Int} quorum 
 * @param {String} rootXPub 
 */
accountsSDK.prototype.createAccount = function(alias, quorum, rootXPub) {
    let retPromise = new Promise((resolve, reject) => {
        getDB().then(db => {
            let transaction = db.transaction(['accounts'], 'readwrite');
            let objectStore = transaction.objectStore('accounts');
            let request = objectStore.add({
                alias:alias,
            });
            request.onsuccess = function () {
                let data = {alias:alias, quorum:quorum, rootXPub:rootXPub, nextIndex:request.result};
                createAccount(data).then(res => {
                    let jsonData = JSON.parse(res.data);
                    let putTransaction = db.transaction(['accounts'], 'readwrite');
                    let putObjectStore = putTransaction.objectStore('accounts');
                    let putRequest = putObjectStore.put(jsonData, request.result);
                    putRequest.onsuccess = function() {
                        resolve(jsonData);
                    };
                    putRequest.onerror = function() {
                        reject(putRequest.error);
                    };
                }).catch(error => {
                    reject(error);
                });
            };
            request.onerror = function() {
                reject(request.error);
            };
        }).catch(error => {
            reject(error);
        });
    });
    return retPromise;
};

/**
 * create account address
 * 
 * @param {Object} account createAccount return account Object val
 * @param {Int} nextIndex 
 */
accountsSDK.prototype.createAccountReceiver = function(account) {
    let retPromise = new Promise((resolve, reject) => {
        getDB().then(db => {
            let transaction = db.transaction(['addresses'], 'readwrite');
            let objectStore = transaction.objectStore('addresses');
            let request = objectStore.add({
                account_id:account.id,
                account_alias:account.alias,
            });
            request.onsuccess = function() {
                let data = {account:JSON.stringify(account), nextIndex: request.result};
                createAccountReceiver(data).then(res => {
                    let jsonData = JSON.parse(res.data);
                    let jsonDB = JSON.parse(res.db);
                    let putTransaction = db.transaction(['addresses'], 'readwrite');
                    let putObjectStore = putTransaction.objectStore('addresses');
                    let putRequest = null;
                    for (let key in jsonDB) {
                        if(!jsonDB.hasOwnProperty(key)) continue;
                        let putData = JSON.parse(jsonDB[key]);
                        putRequest = putObjectStore.put(putData, request.result);
                    }
                    putRequest.onsuccess = function() {
                        resolve(jsonData);
                    };
                    putRequest.onerror = function() {
                        reject(putRequest.error);
                    };
                }).catch(error => {
                    reject(error);
                });
            };
            request.onerror = function() {
                reject(request.error);
            };
        }).catch(error => {
            reject(error);
        });
    });
    return retPromise;
};

export default accountsSDK;