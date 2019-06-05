const fs = require('fs')

const fileNames = fs.readdirSync('./output')
const sdclFileNames = fileNames.filter(fileName => fileName.indexOf('.sdcl') > 0)
const outputFilePathPrefix = './output/ver1/'
sdclFileNames.forEach((sdclFileName, index) => {
  const file = fs.readFileSync(`./output/${sdclFileName}`)
  const json = JSON.parse(file.toString())
  json.DetectedSegments.forEach(segment => {
    segment.LabelData.forEach(labelData => {
      if (isNaN(labelData.value)) {
        labelData.name = 'Labeling'
      }
    })
  })
  fs.writeFileSync(`${outputFilePathPrefix}${sdclFileName}`, JSON.stringify(json))
})
