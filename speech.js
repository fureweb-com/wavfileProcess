// output 내 wav파일을 모두 읽어온다.
const fs = require('fs')
const speech = require('@google-cloud/speech');
const wavFileInfo = require('wav-file-info')

const fileNames = fs.readdirSync('./output')
const wavFileNames = fileNames.filter(fileName => fileName.indexOf('.wav') > 0)
const outputFilePathPrefix = './sdcl/'

const getAudioTimestamp = (time) => {
  return (16000 * ((time.seconds + time.nanos) / 1000000000.0))
}

const makeDclFile = (wavFileName, speechResult = [], trim_sensor_end) => {
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

  fs.writeFileSync(`${outputFilePathPrefix}${wavFileName.replace('.wav', '.dcl')}`, JSON.stringify(dcl))
}

const makeSdclFile = (wavFileName, speechResult = []) => {
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

  fs.writeFileSync(`${outputFilePathPrefix}${wavFileName.replace('.wav', '.sdcl')}`, JSON.stringify(sdcl))
}

wavFileNames.forEach(async (wavFileName, index) => {
  if (index > 0) return

  console.log(`processing... ${wavFileName}`)
  const client = new speech.SpeechClient()
  const fileName = `./output/${wavFileName}`

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
  const speechResult = response.results[0].alternatives[0]

  // 동기 보장을 위해 아래에서 두개 다 사용
  const wavInfo = wavFileInfo.infoByFilename(fileName, (err, info) => {
    makeDclFile(wavFileName, speechResult, Number(info.duration * 16000).toFixed(1))
    makeSdclFile(wavFileName, speechResult)
  })
})


