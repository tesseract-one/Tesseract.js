import { build, copyDir, exit } from '../../build'
import { fileURLToPath } from 'url'
import path from 'path'

const pipeline = build(
  path.dirname(fileURLToPath(import.meta.url)),
  [
    '@tesseractjs/core',
    '@tesseractjs/ethereum',
    '@tesseractjs/openwallet-ethereum'
  ]
).then(() => copyDir('./lib', './dist'))

exit(pipeline)