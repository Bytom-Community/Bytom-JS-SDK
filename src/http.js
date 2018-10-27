import axios from 'axios';

const basePath = 'api/v1/btm/';

export function serverHttp(host) {
    this.host = host;
    this.request = function(path, body, net) {
        var config = {
            url: `${this.host[net]}${basePath}${path}`,
            method: 'POST',
            headers: {
                Accept: 'application/json',
            },
            data: body,
            timeout: 10000
        };

        //return Promise
        return axios.request(config);
    };
}

export function http(baseUrl, token) {
    this.baseUrl = baseUrl;
    this.token = token;
    this.request = function(path, body) {
        var config = {
            url: `${this.baseUrl}${path}`,
            method: 'POST',
            headers: {
                Accept: 'application/json',
            },
            data: body,
            timeout: 1000
        };

        if (this.token) {
            config.headers.Authorization = `Basic ${btoa(this.token)}`;
        }
        //return Promise
        return axios.request(config).then(function(resp){
            if (resp.data.status === 'fail') {
                throw resp.data.msg;
            } else if (resp.data.status === 'success') {
                return resp.data.data;
            }
            return resp.data;
        });
    };
}