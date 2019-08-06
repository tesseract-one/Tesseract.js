import typescript from 'rollup-plugin-typescript2'
import autoExternal from 'rollup-plugin-auto-external'
import cleanup from 'rollup-plugin-cleanup'

const config = [
    {
        input: 'src/index.ts',
        output: [
            {
                file: '',
                format: 'cjs'
            },
            {
                name: '',
                file: '',
                format: 'umd',
                globals: {}
            }
        ],
        plugins: [
            autoExternal(),
            typescript(
                {
                    typescript: require("typescript"),
                    useTsconfigDeclarationDir: true,
                    clean: true,
                    tsconfigOverride: {
                        compilerOptions: {
                            target: "es5"
                        }
                    }
                }
            ),
            cleanup()
        ]
    },
    {
        input: 'src/index.ts',
        output: {
            file: '',
            format: 'es',
            paths: {
                '@tesseractjs/core': '@tesseractjs/core/core.mjs',
                '@tesseractjs/ethereum': '@tesseractjs/ethereum/ethereum.mjs',
                '@tesseractjs/ethereum-web3': '@tesseractjs/ethereum-web3/ethereum-web3.mjs',
                '@tesseractjs/openwallet': '@tesseractjs/openwallet/openwallet.mjs',
                '@tesseractjs/openwallet-ethereum': '@tesseractjs/openwallet-ethereum/openwallet-ethereum.mjs'
            }
        }
        ,
        plugins: [
            autoExternal(),
            typescript(
                {
                    typescript: require("typescript"),
                    useTsconfigDeclarationDir: true,
                    clean: true
                }
            ),
            cleanup()
        ]
    }
];

export const packageNames = {
    "@tesseractjs/core": "Tesseract",
    "@tesseractjs/openwallet": "TesseractOpenWallet",
    "@tesseractjs/ethereum": "TesseractEthereum",
    "@tesseractjs/openwallet-ethereum": "TesseractOpenWalletEthereum",
    "@tesseractjs/ethereum-web3": "TesseractEthereumWeb3"
}

/**
 * Returns the rollup configuration with globals and names set.
 *
 * @param {String} name
 * @param {String} outputFileName
 * @param {Object} globals
 *
 * @returns {Array}
 */
export function rollupConfig(name, outputFileName, globals) {
    // CJS
    config[0].output[0].file = 'dist/' + outputFileName + '.js';

    // UMD
    config[0].output[1].name = name;
    config[0].output[1].file = 'dist/' + outputFileName + '.umd.js';
    config[0].output[1].globals = globals || {};

    // ESM
    config[1].output.file = 'dist/' + outputFileName + '.mjs';

    return config;
};
