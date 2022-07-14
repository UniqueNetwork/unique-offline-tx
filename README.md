# EXAMPLE - Signing Unique transactions offline

## Running this example

1. Install Parity sidecar API:

https://github.com/paritytech/substrate-api-sidecar#npm-package-installation-and-usage

2. Run sidecar:


For Unique:
```
SAS_SUBSTRATE_WS_URL=wss://us-ws.unique.network/ substrate-api-sidecar
```

For Quartz:
```
SAS_SUBSTRATE_WS_URL=wss://us-ws-quartz.unique.network substrate-api-sidecar
```

3. Install and run:

```
npm install
node offline.js 
```

Default behavior is to transfer from Alice to Bob.
The environment variable SEED may be specified, in which case the script should be edited to specify `accountFrom` address.