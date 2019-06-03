const words = {
  1: '엘라',
  2: '동작',
  3: '정지',
  4: '모드',
  5: '에코',
  6: '저장',
  7: '불켜줘',
  8: '불꺼줘',
  9: '공기청정기',
  10: '엘라',
  11: '동작',
  12: '정지',
  13: '모드',
  14: '에코',
  15: '저장',
  16: '불켜줘',
  17: '불꺼줘',
  18: '공기청정기',
}

// ffmpeg -i inputfile -ar 16000 outputfile
const makeWordById = (elem, index) => index === 2 ? `${elem}_${words[elem]}` : elem
const makeNewFilePath = (filePath) => {
  if (!String(filePath).startsWith('tasks')) throw new Error('반드시 tasks로 시작하는 filepath를 인자로 넘겨야합니다.')
  return filePath.split('/').map(makeWordById).join('_')
}

module.exports = {
  words,
  makeNewFilePath
}
