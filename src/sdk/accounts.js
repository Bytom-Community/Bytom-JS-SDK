import {getDB} from '../db/db';
import {createAccount, createAccountReceiver} from '../wasm/func';

function accountsSDK(http){
    this.http = http;
}

accountsSDK.prototype.createAccountReceiverUseServer = function(guid) {
    let retPromise = new Promise((resolve, reject) => {
        this.http.request('account/new-address', {guid:guid}).then(resp => {
            let dbData = resp.data.data;
            dbData.guid = guid;
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
            reject(error);
        });
    });
    return retPromise;
};

accountsSDK.prototype.createAccountUseServer = function(rootXPub) {
    let retPromise = new Promise((resolve, reject) => {
        this.http.request('account/create', {pubkey: rootXPub}).then(resp => {
            let dbData = resp.data.data;
            dbData.rootXPub = rootXPub;
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
            reject(error);
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