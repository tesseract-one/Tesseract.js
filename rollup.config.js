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
        output: [
            {
                file: '',
                format: 'es'
            }
        ],
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
    "@tesseract/core": "Tesseract",
    "@tesseract/openwallet": "TesseractOpenWallet",
    "@tesseract/ethereum": "TesseractEthereum",
    "@tesseract/openwallet-ethereum": "TesseractOpenWalletEthereum",
    "@tesseract/ethereum-web3": "TesseractEthereumWeb3"
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
    config[0].output[0].file = 'dist/' + outputFileName + '.cjs.js';

    // UMD
    config[0].output[1].name = name;
    config[0].output[1].file = 'dist/' + outputFileName + '.umd.js';
    config[0].output[1].globals = globals || {};

    // ESM
    config[1].output[0].file = 'dist/' + outputFileName + '.esm.js';

    return config;
};
