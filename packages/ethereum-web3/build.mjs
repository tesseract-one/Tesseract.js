import { build, copyDir, exit, handleArgs } from '../../build.mjs'
import { fileURLToPath } from 'url'
import path from 'path'

const pipeline = handleArgs(path.dirname(fileURLToPath(import.meta.url)), (workdir) => {
  return build(workdir, [
    '@tesseractjs/core',
    '@tesseractjs/ethereum',
    '@tesseractjs/openwallet',
    '@tesseractjs/openwallet-ethereum'
  ]).then(() => copyDir('./lib', './dist'))
})

exit(pipeline)