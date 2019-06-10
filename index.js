// ffmpeg 설치 필요
const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
const { makeNewFilePath } = require('./words.js')
const filePathList = require('./filePathList.js')



// output 내 wav파일을 모두 읽어온다.
const speech = require('@google-cloud/speech');
const wavFileInfo = require('wav-file-info')
const outputFilePathPrefix = './sdcl/'

const getAudioTimestamp = (time) => {
  return (16000 * ((time.seconds + time.nanos) / 1000000000.0))
}

const makeDclFile = (wavFileName, speechResult = [], trim_sensor_end) => {
  console.log('makeDcl..')
  const dcl = {
    "trim_sensor_start": 0.0,
    "trim_sensor_end": +trim_sensor_end,
    "capture_configuration_uuid": "616c4535-febf-48cf-bc59-deff1c6dcf51",
    "SampleRate": 16000,
    "CalculatedSampleRate": 0.0,
    "FileMetadata": [
      {
        "value": "unknown",
        "name": "Label",
        "type": "string",
        "capture_sample_sequence_start": 0,
        "capture_sample_sequence_end": 0,
        "uuid": null,
        "segmenter": null
      },
      {
        "value": "unknown",
        "name": "sex",
        "type": "string",
        "capture_sample_sequence_start": 0,
        "capture_sample_sequence_end": 0,
        "uuid": null,
        "segmenter": null
      },
      {
        "value": "NBT",
        "name": "Subject",
        "type": "string",
        "capture_sample_sequence_start": 0,
        "capture_sample_sequence_end": 0,
        "uuid": null,
        "segmenter": null
      },
      {
        "value": speechResult.words.map(word => word.word).join(''),
        "name": "word",
        "type": "string",
        "capture_sample_sequence_start": 0,
        "capture_sample_sequence_end": 0,
        "uuid": null,
        "segmenter": null
      }
    ],
    "video_configurations": [
  
    ],
    "SensorAdjust": null
  }

  fs.writeFileSync(`${wavFileName.replace('.wav', '.dcl')}`, JSON.stringify(dcl))
}

const makeSdclFile = (wavFileName, speechResult = []) => {
  console.log('makeSdcl..')
  // 작성할 sdcl 파일 규격
  const sdcl = { DetectedSegments: [] }
  
  speechResult.words.forEach((word, i) => {
    const detectedSegment = {
      Segmenter: 2047,
      LabelData: [
        {
          value: String((i + 1)),
          name: 'SegmentID',
          type: 'string',
          capture_sample_sequence_start: getAudioTimestamp(word.startTime),
          capture_sample_sequence_end: getAudioTimestamp(word.endTime),
          uuid: null,
          segmenter: 2047
        },
        {
          value: word.word,
          name: 'Label',
          type: 'string',
          capture_sample_sequence_start: getAudioTimestamp(word.startTime),
          capture_sample_sequence_end: getAudioTimestamp(word.endTime),
          uuid: null,
          segmenter: 2047
        }
      ],
      SegmentWindow: {
        StartSample: getAudioTimestamp(word.startTime),
        EndSample: getAudioTimestamp(word.endTime)
      }
    }
    sdcl.DetectedSegments.push(detectedSegment)
  })

  fs.writeFileSync(`${wavFileName.replace('.wav', '.sdcl')}`, JSON.stringify(sdcl))
}

const successLogFile = fs.createWriteStream('./success.log', { flags: 'w'})
const errorLogFile = fs.createWriteStream('./error.log', { flags: 'w' })

const getOutputFile = filePath => 'output/' + makeNewFilePath(filePath)
const getFilePathObject = filePath => {
  // const dclFilePath = `${filePath.split('.')[0]}.dcl`
  // const sdclFilePath = `${filePath.split('.')[0]}.sdcl`

  const outputFilePath = path.resolve(getOutputFile(filePath))
  // const dclFilePaths = [path.resolve(dclFilePath), path.resolve(getOutputFile(dclFilePath))]
  // const sdclFilePaths = [path.resolve(sdclFilePath), path.resolve(getOutputFile(sdclFilePath))]

  return { outputFilePath }
}
const printResult = (error, stdout, stderr) => {
  if (error) return errorLogFile.write(`${error}\n`)

  // 성공 시 stderr로 출력됨 -_-;; ffmpeg..
  // if (stdout) successLogFile.write(`${stdout}\n`)
  // if (stderr) successLogFile.write(`${stderr}\n`)
}

(async _=> {
  for (let index = 0; index < filePathList.length; index ++) {
    const wavFileName = filePathList[index]
  
    console.log(`processing... ${wavFileName}`)
    const client = new speech.SpeechClient()
    const fileName = `./${wavFileName}`
  
    const file = fs.readFileSync(fileName)
    const audioBytes = file.toString('base64')
  
    const audio = {
      content: audioBytes,
    };
    const config = {
      encoding: 'LINEAR16',
      languageCode: 'ko-KR',
      model: 'command_and_search',
      enableWordTimeOffsets: true
  
    };
    const request = {
      audio: audio,
      config: config,
    };
    // 파일을 읽어서 speech to text 요청
  
    const [response] = await client.recognize(request)
    try {
      const speechResult = response.results[0].alternatives[0]
  
      // 동기 보장을 위해 아래에서 두개 다 사용
      const wavInfo = wavFileInfo.infoByFilename(fileName, (err, info) => {
        const {outputFilePath} = getFilePathObject(wavFileName)
        console.log('outputFilePath', outputFilePath)
        makeDclFile(outputFilePath, speechResult, Number(info.duration * 16000).toFixed(1))
        makeSdclFile(outputFilePath, speechResult)
        exec(`ffmpeg -i ${wavFileName} -ar 16000 ${outputFilePath} -y`, printResult)
        console.log('fileName:', outputFilePath)
      })

    } catch (e) {
      console.error('file process error:::', fileName)
      fs.writeFileSync(`./error/${fileName.split('.').join('').replace(/\//g, '_')}`, '')
    }
    
  }
})()
