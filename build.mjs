import cprocess from 'child_process'
import util from 'util'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import decomment from 'decomment'

const readdir = util.promisify(fs.readdir)
const mkdir = util.promisify(fs.mkdir)
const lstat = util.promisify(fs.lstat)
const unlink = util.promisify(fs.unlink)
const readfile = util.promisify(fs.readFile)
const writefile = util.promisify(fs.writeFile)
const copyFile = util.promisify(fs.copyFile)

export function exec(workdir, command, args) {
  return new Promise((resolve, reject) => {
    const p = cprocess.spawn(command, args, { cwd: workdir, stdio: 'inherit' })
    p.once('exit', (code) => code === 0 ? resolve() : reject(new Error('non zero exit code: '+code)))
    p.once('error', (err) => reject(err))
  })
}

async function toMjs(dataDir, imports) {
  const files = await readdir(dataDir)
  for (const file of files) {
    const filePath = path.join(dataDir, file)
    const stat = await lstat(filePath)
    if (stat.isDirectory()) {
      await toMjs(filePath, imports)
      continue
    }
    if (!filePath.endsWith('.js')) continue
    await fixMjsImports(filePath, filePath.slice(0, -2) + 'mjs', imports)
    await unlink(filePath)
  }
}

async function fixMjsImports(file, outFile, imports) {
  let data = await readfile(file, { encoding: 'utf8' })
  for (const imp of imports) {
    data = data
      .split('"'+imp+'"').join('"'+imp+'/esm"')
      .split("'"+imp+"'").join("'"+imp+"/esm'")
  }
  await writefile(outFile, data)
}

async function getOutDir(workdir, config) {
  const clearedJson = decomment(await readfile(path.join(workdir, config), { encoding: 'utf8'}))
  const tsconfig = JSON.parse(clearedJson)
  return tsconfig['compilerOptions']['outDir']
}

async function fixPackageJson(workdir, outDir) {
  const pkg = JSON.parse(await readfile(path.join(workdir, 'package.json'), { encoding: 'utf8'}))
  const fullOutDir = path.join(workdir, outDir)
  pkg['main'] = path.relative(fullOutDir, path.join(workdir, pkg['main']))
  pkg['module'] = path.relative(fullOutDir, path.join(workdir, pkg['module']))
  pkg['types'] = path.relative(fullOutDir, path.join(workdir, pkg['types']))
  await writefile(path.join(outDir, 'package.json'), JSON.stringify(pkg, null, '\t'))
}

export async function copyDir(src, dest) {
  const isDirectory = (await lstat(src)).isDirectory()
  if (isDirectory) {
    await mkdir(dest, { recursive: true })
    const files = await readdir(src)
    for (const file of files) {
      await copyDir(path.join(src, file), path.join(dest, file))
    }
  } else {
    await copyFile(src, dest)
  }
}

export async function build(workdir, imports) {
  const tsc = path.join(path.dirname(fileURLToPath(import.meta.url)), 'node_modules/.bin/tsc')
  const outDir = await getOutDir(workdir, 'tsconfig.cjs.json')
  const esmOutDir = await getOutDir(workdir, 'tsconfig.json')
  await exec(workdir, tsc, ['-p', 'tsconfig.json'])
  await toMjs(path.join(workdir, esmOutDir), imports)
  await exec(workdir, tsc, ['-p', 'tsconfig.cjs.json'])
  await fixPackageJson(workdir, outDir)
  await copyFile(path.join(workdir, 'README.md'), path.join(workdir, outDir, 'README.md'))
  await copyFile(path.join(workdir, '../../LICENSE'), path.join(workdir, outDir, 'LICENSE'))
}

export function exit(promise) {
  promise
    .then(() => process.exit(0))
    .catch((err) => {
      console.log('Error:', err)
      process.exit(1)
    })
}

export default function buildAndExit(url, imports) {
  exit(build(path.dirname(fileURLToPath(url)), imports))
}