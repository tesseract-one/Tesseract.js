import { rollupConfig, packageNames } from '../../rollup.config';
import pkg from './package.json'

export default rollupConfig(packageNames[pkg.name], 'core', packageNames);