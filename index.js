// ffmpeg 설치 필요
const fs = require('fs')
const { exec } = require('child_process')
const { makeNewFilePath } = require('./words.js')
const filePathList = require('./filePathList.js')

const successLogFile = fs.createWriteStream('./success.log', { flags: 'w'})
const errorLogFile = fs.createWriteStream('./error.log', { flags: 'w' })

const getOutputFile = filePath => 'output/' + makeNewFilePath(filePath)
const getFilePathObject = filePath => {
  const dclFilePath = `${filePath.split('.')[0]}.dcl`
  const sdclFilePath = `${filePath.split('.')[0]}.sdcl`

  const outputFilePath = getOutputFile(filePath)
  const dclFilePaths = [dclFilePath, getOutputFile(dclFilePath)]
  const sdclFilePaths = [sdclFilePath, getOutputFile(sdclFilePath)]

  return { outputFilePath, dclFilePaths, sdclFilePaths}
}
const printResult = (error, stdout, stderr) => {
  if (error) return errorLogFile.write(`${error}\n`)

  // 성공 시 stderr로 출력됨 -_-;; ffmpeg..
  if (stdout) successLogFile.write(`${stdout}\n`)
  if (stderr) successLogFile.write(`${stderr}\n`)
}

filePathList.forEach(filePath => {
  const {outputFilePath, dclFilePaths, sdclFilePaths} = getFilePathObject(filePath)

  // wav파일 다운샘플링 및 dcl 파일 복사 처리
  exec(`ffmpeg -i ${filePath} -ar 16000 ${outputFilePath} -y`, printResult)
  exec(`cp ${dclFilePaths[0]} ${dclFilePaths[1]}`, printResult)
  exec(`cp ${sdclFilePaths[0]} ${sdclFilePaths[1]}`, printResult)
})
