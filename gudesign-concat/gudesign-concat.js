#!/usr/bin/env node

require('pdjs')
const globby = require('globby')
const sharp = require('sharp')
const fs = require('fs')
const path = require('path')
const { sumBy, max, groupBy, trimEnd } = require('lodash')

const RESIZE = {
  mobile: 720,
  desktop: 1200,
}

function printHelp() {
  console.log(`
$ design-concat TYPE                      // concat all NAME01.PNG into output/NAME.jpg

Type
  mobile:   resize 720x
  desktop:  resize 1200x
  raw:      no-resize
`)
}

async function main() {
  const args = process.argv.slice(2)

  // $ design-concat
  if (args.length === 0) {
    printHelp()
    process.exit()
  }


  // $ design-concat TYPE
  if (args.length === 1) {
    const allFiles = await globby(['*.{png,jpg}'], { case: false })

    if (allFiles.length === 0) {
      console.log(`Don't have *.{png,jpg} files.`)
      process.exit()
    }

    const type = args[0]
    const resizeWidth = RESIZE[type]

    // Ensure directory
    fs.mkdir('output', () => {})

    // { 'name': ['name01.jpg', 'name02.jpg'], .. }
    const group = groupBy(allFiles, v => trimEnd(path.parse(v).name, '0123456789'))
    for (let [name, files] of Object.entries(group)) {
      await concat(files, `output/${name}.jpg`, {
        resize: [resizeWidth],
        background: 'rgb(189,189,189)',
        offset: 20
      })

    }
  }
}

const DEFAULT_OPTIONS = {
  resize: [null, null],
  background: 'white',
  offset: 0
}

async function concat(files, output, options={}) {
  if (files.length === 0) {
    return
  }
  options = Object.assign({}, DEFAULT_OPTIONS, options)

  // [ {data, info: {width, height}}, ... ]
  filesData = await Promise.all(files.map(file => sharp(file).resize(...options.resize).raw().toBuffer({resolveWithObject: true})))
  const outputOptions = {
    width: sumBy(filesData, v => v.info.width) + options.offset * (filesData.length-1),
    height: max(filesData.map(v => v.info.height)),
    channels: 3
  }

  let outputBuffer = await sharp({ create: {...outputOptions, background: options.background } }).raw().toBuffer()
  let left = 0
  for (let [i, file] of filesData.entries()) {
    outputBuffer = await sharp(outputBuffer, {raw: outputOptions})
      .overlayWith(file.data, { raw: file.info, top: 0, left })
      .raw().toBuffer()
    left = left + file.info.width + options.offset
  }

  await sharp(outputBuffer, { raw: outputOptions }).toFile(output)
  console.log(`> Create ${output}`)
}

main()
