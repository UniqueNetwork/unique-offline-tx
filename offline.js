const { methods, getRegistryBase, getSpecTypes, TypeRegistry, construct } = require('@substrate/txwrapper-polkadot');
const { EXTRINSIC_VERSION } = require('@polkadot/types/extrinsic/v4/Extrinsic');
const request = require('request-promise');

const { Keyring } = require('@polkadot/keyring');
var BigNumber = require('bignumber.js');
BigNumber.config({ DECIMAL_PLACES: 18, ROUNDING_MODE: BigNumber.ROUND_DOWN, decimalSeparator: '.', EXPONENTIAL_AT: 255 });

const accountFrom = "unjKJQJrRd238pkUZZvzDQrfKuM39zBSnQ5zjAGAGcdRhaJTx";
const accountFromSeed = process.env.SEED || "//Alice";
const accountTo = "unhk98EgHVJ3Efjz4912GfWkMoW2GXe3SuFrQ6u2bYeWToXrE";
const amount = 10;
const sideCarBaseUrl = "http://localhost:8080";

const types = {
    Keys: 'AccountId',
    SmartContract: {
        _enum: {
            Evm: 'H160',
            Wasm: 'AccountId',
        },
    },
    EraIndex: 'u32',
    EraStakingPoints: {
        total: 'Balance',
        stakers: 'BTreeMap<AccountId, Balance>',
        formerStakedEra: 'EraIndex',
        claimedRewards: 'Balance',
    },
    EraRewardAndStake: {
        rewards: 'Balance',
        staked: 'Balance',
    },
};

const chainProperties = {
    ss58Format: 7391,
    tokenDecimals: 18,
    tokenSymbol: 'UNQ',
};

async function main() {
    ////////////////////////////////////////////////////////////////
    const {
        at: { hash: blockHash, height: blockNumber },
        genesisHash,
        chainName,
        specName,
        specVersion,
        txVersion: transactionVersion,
        metadata: metadataRpc
    } = await request.get({
        url: sideCarBaseUrl + '/transaction/material',
        json: true
    });

    const {
        nonce
    } = await request.get({
        url: sideCarBaseUrl + `/accounts/${accountFrom}/balance-info`,
        json: true
    });
    
    const registry = new TypeRegistry();
    registry.setKnownTypes({ types });

    const registryBase = getRegistryBase({
        chainProperties,
        specTypes: getSpecTypes(registry, chainName, specName, specVersion),
        metadataRpc
    });

    const value = new BigNumber(amount).times(10 ** chainProperties.tokenDecimals).toString(); // tokenDecimals=18
    const unsignedTx = methods.balances.transferKeepAlive(
        {
          dest: accountTo,
          value,
        },
        {
          address: accountFrom,
          blockHash,
          blockNumber,
          genesisHash,
          metadataRpc,
          nonce,
          specVersion,
          tip: 0,
          eraPeriod: 64,
          transactionVersion,
        },
        {
          metadataRpc,
          registry: registryBase, // Type registry
        }
    );

    const { txHash: getTxHash, signedTx: createSignedTx, signingPayload: createSigningPayload } = construct;
    const signingPayload = createSigningPayload(unsignedTx, { registry });
    
    const keyring = new Keyring({ type: 'sr25519' });
    keyring.setSS58Format(chainProperties.ss58Format);
    const keyPair = keyring.addFromUri(accountFromSeed);

    const { signature } = registryBase.createType('ExtrinsicPayload', signingPayload, { version: EXTRINSIC_VERSION }).sign(keyPair);

    const serialized = createSignedTx(unsignedTx, signature, { metadataRpc, registry: registryBase });

    console.log('======================');
    console.log('serialized:', serialized);
    console.log('hash:', getTxHash(serialized));
    console.log('======================');

    // Submit
    const submiturl = sideCarBaseUrl + '/transaction';
    const tx_headers = "{'Content-type' : 'application/json', 'Accept' : 'text/plain'}";
    response = await request.post({
        url: submiturl,
        json: true,
        body: {'tx': serialized},
        headers: tx_headers
    });
    console.log(response);
}

main().catch(console.error).finally(() => process.exit());
