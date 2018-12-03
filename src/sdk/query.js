import { handleAxiosError } from '../utils/http';

function querySDK(bytom) {
    this.bytom =bytom; 
    this.http = bytom.serverHttp;
}
/**
 * Query the price of an asset on a given blockchain. asset_id is a hexdecimal string.
 *
 * @param {String} asset_id
 */
querySDK.prototype.asset = function(asset_id) {
    let net = this.bytom.net;
    let retPromise = new Promise((resolve, reject) => {
        this.http.request('q/asset?id=' + asset_id, null, net, 'GET').then(resp => {
            resolve(resp.data);
        }).catch(err => {
            reject(handleAxiosError(err));
        });
    });
    return retPromise;
};

/**
 * Query the current height of a blockchain.
 */
querySDK.prototype.getblockcount = function() {
    let net = this.bytom.net;
    let retPromise = new Promise((resolve, reject) => {
        this.http.request('q/chain-status', null, net, 'GET').then(resp => {
            resolve(resp.data);
        }).catch(err => {
            reject(handleAxiosError(err));
        });
    });
    return retPromise;
};

export default querySDK;