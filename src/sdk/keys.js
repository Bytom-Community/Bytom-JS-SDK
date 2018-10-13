import {createKey, resetKeyPassword} from '../wasm/func';
import {getDB} from '../db/db';

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
    let retPromise = new Promise((resolve, reject) => {
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
                        const updateData = cursor.value;
                        updateData.key = res.data;
                        const request = cursor.update(updateData);
                        request.onsuccess = function() {
                            resolve(true);
                        };
                        request.onerror = function() {
                            reject(new Error('db update error'));
                        };
                    } else {
                        reject(new Error('db update error: not found by rootXPub'));
                    }
                };
                getRequest.onerror = function () {
                    reject(new Error('db get error'));
                };
            }).catch(error => {
                reject(error);
            });
        }).catch(error => {
            reject(error);
        });
    });
    return retPromise;
};

/**
 * get key by XPub
 * 
 * @param {String} xpub 
 */
keysSDK.prototype.getKeyByXPub = function(xpub) {
    let retPromise = new Promise((resolve, reject) => {
        getDB().then(db => {
            let getRequest = db.transaction(['keys'], 'readonly')
                .objectStore('keys')
                .index('xpub')
                .get(xpub);
            getRequest.onsuccess = function(e) {
                if(e.target.result) {
                    resolve(e.target.result.key);
                } else {
                    reject(new Error('not found by XPub'));    
                }
            };
            getRequest.onerror = function() {
                reject(new Error('db get error'));
            };
        }).catch(error => {
            reject(error);
        });
    });
    return retPromise;
};

/**
 * List key
 *
 * @returns {Promise}
 */
keysSDK.prototype.list = function() {
    let retPromise = new Promise((resolve, reject) => {
        getDB().then(db => {
            let transaction = db.transaction(['keys'], 'readonly');
            let objectStore = transaction.objectStore('keys');
            let oc = objectStore.openCursor();
            let ret = [];
            oc.onsuccess = function (event) {
                var cursor = event.target.result;
                if (cursor) {
                    ret.push({alias: cursor.value.alias, xpub: cursor.value.xpub});
                    cursor.continue();
                } else {
                    resolve(ret);
                }
            };
            oc.onerror = function(e){
                reject(e);
            };
        }).catch(err => {
            reject(err);
        });
    });
    return retPromise;
};

/**
 * Create a new key.
 * 
 * @param {String} alias - User specified, unique identifier.
 * @param {String} password - User specified, key password.
 */
keysSDK.prototype.create = function(alias, password) {
    var normalizedAlias = alias.toLowerCase().trim();
    let retPromise = new Promise((resolve, reject) => {
        getDB().then(db => {
            let getRequest = db.transaction(['keys'], 'readonly')
                .objectStore('keys')
                .index('alias')
                .get(normalizedAlias);
            getRequest.onsuccess = function (e) {
                if (e.target.result) {
                    reject(new Error('alias already exists'));
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
                    request.onsuccess = function () {
                        resolve({xpub:jsonData.xpub, alias: alias});
                    };
                    request.onerror = function () {
                        reject(new Error('db insert error'));
                    };
                }).catch(error => {
                    reject(error);    
                });
            };
            getRequest.onerror = function () {
                reject(new Error('db get error'));
            };
        }).catch(error => {
            reject(error);
        });
    });
    return retPromise;
};

export default keysSDK;