import { rollupConfig, packageNames } from '../../rollup.config';
import pkg from './package.json'

export default rollupConfig(packageNames[pkg.name], 'ethereum-web3', { 
  'web3': 'Web3',
  'web3-core': 'Web3Core',
  'web3-providers': 'Web3Providers',
  'web3-core-method': 'Web3CoreMethod',
  ...packageNames
});