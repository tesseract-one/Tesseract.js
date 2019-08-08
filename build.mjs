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

const TSCONFIG_CJS = 'tsconfig.cjs.json'
const TSCONFIG_MJS = 'tsconfig.json'

export function exec(workdir, command, args) {
  return new Promise((resolve, reject) => {
    const p = cprocess.spawn(command, args, { cwd: workdir, stdio: 'inherit' })
    p.once('exit', (code) => code === 0 ? resolve() : reject(new Error('non zero exit code: '+code)))
    p.once('error', (err) => reject(err))
  })
}

async function toMjs(dataDir, imports) {
  const files = await readdir(dataDir)
  const tasks = files.map(async (file) => {
    const filePath = path.join(dataDir, file)
    const stat = await lstat(filePath)
    if (stat.isDirectory()) {
      await toMjs(filePath, imports)
      return
    }
    if (filePath.endsWith('.js')) {
      await fixMjsImports(filePath, filePath.slice(0, -2) + 'mjs', imports)
      await unlink(filePath)
    }
    if (filePath.endsWith('.d.ts')) {
      await fixMjsImports(filePath, filePath, imports)
    }
  })
  await Promise.all(tasks)
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
  const outDir = await getOutDir(workdir, TSCONFIG_CJS)
  const esmOutDir = await getOutDir(workdir, TSCONFIG_MJS)
  await exec(workdir, tsc, ['-p', TSCONFIG_MJS])
  await toMjs(path.join(workdir, esmOutDir), imports)
  await exec(workdir, tsc, ['-p', TSCONFIG_CJS])
  await copyFile(path.join(workdir, 'README.md'), path.join(workdir, outDir, 'README.md'))
}

export function exit(promise) {
  promise
    .then(() => process.exit(0))
    .catch((err) => {
      console.log('Error:', err)
      process.exit(1)
    })
}

export async function handleArgs(workdir, onBuild) {
  if (process.argv.length > 2 && process.argv[2] === 'package') {
    const outDir = await getOutDir(workdir, TSCONFIG_CJS)
    return await fixPackageJson(workdir, outDir)
  } else {
    return await onBuild(workdir)
  }
}

export default function runBuildAndExit(url, imports) {
  const pipeline = handleArgs(path.dirname(fileURLToPath(url)), (workdir) => {
    return build(workdir, imports)
  })
  exit(pipeline)
}