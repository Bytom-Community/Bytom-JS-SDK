import {getDB} from '../db/db';
import {createAccount, createAccountReceiver} from '../wasm/func';

function accountsSDK(){    
}

/**
 * create account
 * 
 * @param {String} alias 
 * @param {Int} quorum 
 * @param {String} rootXPub 
 */
accountsSDK.prototype.createAccount = function(alias, quorum, rootXPub) {
    let returnPromise = new Promise((resolve, reject) => {
        getDB().then(db => {
            let transaction = db.transaction(['accounts'], 'readwrite');
            let objectStore = transaction.objectStore('accounts');
            let request = objectStore.add({
                alias:alias,
            });
            request.onsuccess = function () {
                let data = {alias:alias, quorum:quorum, rootXPub:rootXPub, nextIndex:request.result};
                createAccount(data).then(res => {
                    let JsonData = JSON.parse(res.data);
                    let putTransaction = db.transaction(['accounts'], 'readwrite');
                    let putObjectStore = putTransaction.objectStore('accounts');
                    let putRequest = putObjectStore.put(JsonData, request.result);
                    putRequest.onsuccess = function() {
                        resolve(JsonData);
                    };
                    putRequest.onerror = function() {
                        resolve(putRequest.error);
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
    return returnPromise;
};

/**
 * 
 * @param {Object} account createAccount return account Object val
 * @param {Int} nextIndex 
 */
accountsSDK.prototype.createAccountReceiver = function(account) {
    let returnPromise = new Promise((resolve, reject) => {
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
                    let JsonData = JSON.parse(res.data);
                    let JsonDB = JSON.parse(res.db);
                    let putTransaction = db.transaction(['addresses'], 'readwrite');
                    let putObjectStore = putTransaction.objectStore('addresses');
                    let putRequest = null;
                    for (let key in JsonDB) {
                        if(!JsonDB.hasOwnProperty(key)) continue;
                        let putData = JSON.parse(JsonDB[key]);
                        putRequest = putObjectStore.put(putData, request.result);
                    }
                    putRequest.onsuccess = function() {
                        resolve(JsonData);
                    };
                    putRequest.onerror = function() {
                        resolve(putRequest.error);
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
    return returnPromise;
};

export default accountsSDK;