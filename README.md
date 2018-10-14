# Bytom-JS-SDK
[![npm version](https://img.shields.io/npm/v/bytom-js-sdk.svg?style=flat-square)](https://www.npmjs.com/package/bytom-js-sdk)

## Install

``` bash
npm install bytom-js-sdk
```

## Use

```javascript
let net = {
    main : "http://main-net-host/",
    test: "http://test-net-host/"
};
let bytom = new Bytom(net, chrome.runtime.getURL("main.wasm"));

//create key
bytom.sdk.keys.create("test_alias", "123456").then((res)=>{
    console.log(res)
}).catch(error => {
    console.log(error)
});
```

## WebAssembly build

Project depends on WebAssembly. \
See [Bytom-WebAssembly](https://github.com/Bytom-Community/Bytom-WebAssembly).