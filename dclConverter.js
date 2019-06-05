const fs = require('fs')

const fileNames = fs.readdirSync('./output')
const dclFileNames = fileNames.filter(fileName => fileName.indexOf('.dcl') > 0)
const outputFilePathPrefix = './output/ver1/'
const captureConfigurationUuid = '975599ca-d416-491f-b08d-451988fa56f3'
dclFileNames.forEach((dclFileName, index) => {
  const file = fs.readFileSync(`./output/${dclFileName}`)
  const json = JSON.parse(file.toString())
  json.capture_configuration_uuid = captureConfigurationUuid
  fs.writeFileSync(`${outputFilePathPrefix}${dclFileName}`, JSON.stringify(json))
})
