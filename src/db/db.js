let db;
let init = false;
//db version
const version = 2;

export async function getDB() {
    await initDB();
    return db;
}
/*eslint no-console: 'off'*/
async function initDB() {
    if (!init) {
        let dbpr = new Promise(function(resolve, reject){
            let request = indexedDB.open('bytom', version);
            request.onerror = function() {
                reject(new Error('Why didn\'t you allow my web app to use IndexedDB?'));
            };
            request.onsuccess = function(event) {
                console.log('open IndexedDB onsuccess');
                db = event.target.result;
                init = true;
                resolve();
            };
            request.onupgradeneeded = function(event) {
                db = event.target.result;
                console.log('onupgradeneeded IndexedDB');
                if (event.oldVersion < 1) {
                    if (!db.objectStoreNames.contains('keys')) {
                        let ObjectStore = db.createObjectStore('keys', { autoIncrement: true });
                        ObjectStore.createIndex('alias', 'alias', { unique: true });
                        ObjectStore.createIndex('xpub', 'xpub', { unique: true });
                    }
                    if(!db.objectStoreNames.contains('accounts')) {
                        let ObjectStore = db.createObjectStore('accounts', { autoIncrement: true });
                        ObjectStore.createIndex('alias', 'alias', { unique: true });
                        ObjectStore.createIndex('id', 'id', { unique: true });
                    }
                    if(!db.objectStoreNames.contains('addresses')) {
                        let ObjectStore = db.createObjectStore('addresses', { autoIncrement: true });
                        ObjectStore.createIndex('AccountID', 'AccountID', { unique: false });
                        ObjectStore.createIndex('Address', 'Address', { unique: true });
                    }
                    if(!db.objectStoreNames.contains('accounts-server')) {
                        let ObjectStore = db.createObjectStore('accounts-server', { autoIncrement: true });
                        ObjectStore.createIndex('guid', 'guid', { unique: true });
                    }
                    if(!db.objectStoreNames.contains('addresses-server')) {
                        let ObjectStore = db.createObjectStore('addresses-server', { autoIncrement: true });
                        ObjectStore.createIndex('guid', 'guid', { unique: false });
                        ObjectStore.createIndex('address', 'address', { unique: true });
                    }
                }
                if (event.oldVersion < 2) {
                    let accountsStore = request.transaction.objectStore('accounts-server');
                    accountsStore.createIndex('alias', 'alias', { unique: true });
                }
            };
        });
        await dbpr;
    }
}