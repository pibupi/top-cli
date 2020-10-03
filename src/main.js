// 1.解析用户的参数 commander
const program = require('commander')
const path = require('path')
const { version } = require('./constants')
// console.log(process.argv)
// 所有的参数列表都在这里，在执行top-cli --help的时候，help参数也会在这里
// [
//   '/usr/local/Cellar/node/13.11.0/bin/node', 当前执行node文件
//   '/usr/local/bin/top-cli', 当前执行的文件夹
//   '--help' // 用户输入的参数
// ]
// 如果有很多command可以采用这样映射写法
const mapActions = {
  create: {
    alias: 'c',
    description: 'create a project',
    example: ['top-cli create <project-name>'],
  },
  config: {
    alias: 'conf',
    description: 'config project varible',
    example: ['top-cli config set <k> <v>', 'top-cli config get <k>'],
  },
  '*': {
    // 输入错误命令在此处可以提示用户
    alias: '',
    description: 'command not found',
    example: [],
  },
}
// Reflect.ownKeys 和 Object.keys是一样的，但是它强大在能循环symbol
Reflect.ownKeys(mapActions).forEach((action) => {
  program
    .command(action) // 创建create命令
    .alias(mapActions[action].alias) // 起个别名c
    .description(mapActions[action].description) // 命令描述
    .action(() => {
      if (action === '*') {
        // 输入错误命令在此处可以提示用户
        console.log(mapActions[action].description)
      } else {
        // 命令动作，要干啥去
        // console.log(action)
        require(path.resolve(__dirname, action))(...process.argv.slice(3))
      }
    })
})
// on方法可以监听，监听help命令
program.on('--help', () => {
  console.log('\nExamples:')
  Reflect.ownKeys(mapActions).forEach((action) => {
    mapActions[action].example.forEach((example) => {
      console.log(`  ${example}`)
    })
  })
})
program.version(version).parse(process.argv) // commander提供了给我们用来解析用户的参数的parse方法
// Options:
//   -h, --help  display help for command
