import {createKey, resetKeyPassword} from "../wasm/func";
import {getDB} from "../db/db";

function keysSDK() {
}

/**
 * reset key password
 * 
 * @param {String}} rootXPub 
 * @param {String} oldPassword 
 * @param {String} newPassword 
 */
keysSDK.prototype.resetKeyPassword = function(rootXPub, oldPassword, newPassword) {
    let returnPromise = new Promise((resolve, reject) => {
        let data = {rootXPub: rootXPub, oldPassword:oldPassword, newPassword:newPassword};
        resetKeyPassword(data).then(res => {
            getDB().then(db => {
                let objectStore = db.transaction(['keys'], 'readwrite').objectStore('keys');
                let index = objectStore.index('xpub');
                let keyRange = IDBKeyRange.only(rootXPub);
                let getRequest = index.openCursor(keyRange);
                getRequest.onsuccess = function (event) {
                    const cursor = event.target.result;
                    if(cursor && cursor.value.xpub === rootXPub) {
                        console.log(cursor);
                        const updateData = cursor.value;
                        updateData.key = res.data;
                        const request = cursor.update(updateData);
                        request.onsuccess = function() {
                            resolve(true);
                        };
                        request.onerror = function() {
                            reject(new Error("db update error"));
                        };
                    } else {
                        reject(new Error("db update error: not found by rootXPub"));
                    }
                };
                getRequest.onerror = function (event) {
                    reject(new Error("db get error"));
                };
            }).catch(error => {
                reject(error);
            });
        }).catch(error => {
            reject(error);
        });
    });
    return returnPromise;
};

/**
 * get key by XPub
 * 
 * @param {String} xpub 
 */
keysSDK.prototype.getKeyByXPub = function(xpub) {
    let returnPromise = new Promise((resolve, reject) => {
        getDB().then(db => {
            let getRequest = db.transaction(['keys'], 'readonly')
                .objectStore('keys')
                .index('xpub')
                .get(xpub);
            getRequest.onsuccess = function(e) {
                if(e.target.result) {
                    resolve(e.target.result.key);
                } else {
                    reject(new Error("not found by XPub"));    
                }
            };
            getRequest.onerror = function(e) {
                reject(new Error("db get error"));
            };
        }).catch(error => {
            reject(error);
        });
    });
    return returnPromise;
};

/**
 * Create a new key.
 * 
 * @param {String} alias - User specified, unique identifier.
 * @param {String} password - User specified, key password.
 */
keysSDK.prototype.create = function(alias, password) {
    var normalizedAlias = alias.toLowerCase().trim();
    let returnPromise = new Promise((resolve, reject) => {
        getDB().then(db => {
            let getRequest = db.transaction(['keys'], 'readonly')
                .objectStore('keys')
                .index('alias')
                .get(normalizedAlias);
            getRequest.onsuccess = function (e) {
                if (e.target.result) {
                    reject(new Error("alias already exists"));
                    return;
                }
                let data = {};
                data.alias = normalizedAlias;
                data.auth = password;
                createKey(data).then((res) => {
                    let jsonData = JSON.parse(res.data);
                    let dbData = {
                        key:res.data,
                        xpub:jsonData.xpub,
                        alias:alias,
                    };
                    let request = db.transaction(['keys'], 'readwrite')
                        .objectStore('keys')
                        .add(dbData);
                    request.onsuccess = function (event) {
                        resolve({xpub:jsonData.xpub, alias: alias});
                    };
                    request.onerror = function (event) {
                        reject(new Error("db insert error"));
                    };
                }).catch(error => {
                    reject(error);    
                });
            };
            getRequest.onerror = function (event) {
                reject(new Error("db get error"));
            };
        }).catch(error => {
            reject(error);
        });
    });
    return returnPromise;
};

export default keysSDK;