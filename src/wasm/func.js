import {LoadWasm} from './go';
import Bytom from '../index';
import keysSDK from '../sdk/keys.js';

//wasm load val
window.wasmIsLoad = false;
window.wasmReceived = false;
window.AllFunc = {};

let AllFuncReceivedResolve;
let funcReceived = new Promise(resolve => {
    AllFuncReceivedResolve = resolve;
});

window.setFuncOver = function() {
    AllFuncReceivedResolve();
};
window.resetWasmStatus = function() {
    window.wasmIsLoad = false;
    window.wasmReceived = false;
    funcReceived = new Promise(resolve => {
        AllFuncReceivedResolve = resolve;
    });
};

//wasm call js func getKeyByXPub
window.getKeyByXPub = function (XPub) {
    let keys = new keysSDK();
    let retPromise = new Promise((resolve, reject) => {
        keys.getKeyByXPub(XPub).then(res => {
            resolve(res);
        }).catch(error => {
            reject(error);
        });
    });
    return retPromise;
};

export async function resetKeyPassword(data) {
    await init();
    let res = newWasmResult();
    window.AllFunc.resetKeyPassword(data, res);
    await res.wait;
    if (res.hasOwnProperty('error')) {
        throw new Error(res.error);
    }
    return res;
}

export async function signTransaction(data) {
    await init();
    let res = newWasmResult();
    window.AllFunc.signTransaction(data, res);
    await res.wait;
    if (res.hasOwnProperty('error')) {
        throw new Error(res.error);
    }
    return res;
}

export async function createAccountReceiver(data) {
    await init();
    let res = newWasmResult();
    window.AllFunc.createAccountReceiver(data, res);
    await res.wait;
    if (res.hasOwnProperty('error')) {
        throw new Error(res.error);
    }
    return res;
}

export async function createAccount(data) {
    await init();
    let res = newWasmResult();
    window.AllFunc.createAccount(data, res);
    await res.wait;
    if (res.hasOwnProperty('error')) {
        throw new Error(res.error);
    }
    return res;
}

export async function createKey(data) {
    await init();
    let res = newWasmResult();
    window.AllFunc.createKey(data, res);
    await res.wait;
    if (res.hasOwnProperty('error')) {
        throw new Error(res.error);
    }
    return res;
}

export async function scMulBase(pri) {
    await init();
    let res = newWasmResult();
    window.AllFunc.scMulBase(pri, res);
    await res.wait;
    if (res.hasOwnProperty('error')) {
        throw new Error(res.error);
    }
    return res;
}

export function newWasmResult() {
    let res = {};
    res.wait = new Promise(function(resolve){
        res.endFunc = resolve;
    });
    return res;
}

async function init() {
    if (!window.wasmReceived) {
        load();
        await funcReceived;
        window.wasmReceived = true;
    }
}

function load(){
    if(!window.wasmIsLoad) {
        LoadWasm();
        if (!WebAssembly.instantiateStreaming) { // polyfill
            WebAssembly.instantiateStreaming = async (resp, importObject) => {
                const source = await (await resp).arrayBuffer();
                return await WebAssembly.instantiate(source, importObject);
            };
        }
        const go = new window.Go();
        let /*mod,*/ inst;
        WebAssembly.instantiateStreaming(fetch(Bytom.wasmPath), go.importObject).then(async (result) => {
            // mod = result.module;
            inst = result.instance;
            /*const run = */go.run(inst);
            window.wasmIsLoad = true;
            // await run;
        });
    }
}