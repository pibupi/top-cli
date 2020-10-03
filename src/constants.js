// 保存用户所需常量
const { version } = require('../package.json')
// 临时存储模版的位置
const downloadDirctory = `${
  process.env[process.platform === 'darwin' ? 'HOME' : 'USERPROFILE']
}/.template` // 设置为隐藏文件，因为下载完后需要解析，再拷贝到别处去
console.log(downloadDirctory) // darwin(mac是这个平台，win是另一个，不一样的)
module.exports = {
  version,
  downloadDirctory,
}
