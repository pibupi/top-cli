const axios = require('axios')
const ora = require('ora')
let downloadGitRepo = require('download-git-repo')
const { promisify } = require('util') // 可以把异步api转换成promise
const fs = require('fs')
const Inquirer = require('inquirer')
let ncp = require('ncp')
const path = require('path')
const MetalSmith = require('metalsmith') // 编译文件夹 找需不需要渲染
// consolidate统一了所有的模版引擎
let { render } = require('consolidate').ejs

render = promisify(render)
ncp = promisify(ncp)

downloadGitRepo = promisify(downloadGitRepo)
const { downloadDirctory } = require('./constants')
// 获取项目列表
const getRepoList = async () => {
  const { data } = await axios.get('https://api.github.com/orgs/zhu-cli/repos')
  return data
}
// 获取对应的版本号列表
const getTagList = async (repo) => {
  const { data } = await axios.get(
    `https://api.github.com/repos/zhu-cli/${repo}/tags`
  )
  return data
}
// 封装loading,采用告戒函数
const waitFnLoading = (fn, message) => async (...args) => {
  // 可能还需要用户配置一些数据，来 结合渲染我的项目
  const spinner = ora(message)
  spinner.start() // 在获取之前，显示loadig
  const result = await fn(...args)
  spinner.succeed() // 关闭loading
  return result
}
const download = async (repo, tag) => {
  let api = `zhu-cli/${repo}`
  if (tag) {
    api += `#${tag}`
  }
  const dest = `${downloadDirctory}/${repo}`
  await downloadGitRepo(api, dest)
  return dest // 下载的最终目录
}
module.exports = async (projectName) => {
  // console.log(projectName)
  // 此文件功能是创建项目，拉取你自己的所有项目列出来 让用户选 安装哪个项目
  // 选完后再显示所有的版本号
  let repos = await waitFnLoading(getRepoList, 'gettting template')()
  repos = repos.map((item) => item.name)

  // 选择模版
  const { repo } = await Inquirer.prompt({
    name: 'repo', // 获取选择后的结果
    type: 'list',
    message: 'please choise a template to create project',
    choices: repos,
  })
  // console.log(repo)
  // 通过选择当前的模版，选择版本号
  // 获取对应的版本号
  let tags = await waitFnLoading(getTagList, 'getting tags')(repo)
  tags = tags.map((item) => item.name)
  // console.log(tags)
  // 选择版本
  const { tag } = await Inquirer.prompt({
    name: 'tag', // 获取选择后的结果
    type: 'list',
    message: 'please choise tags to create project',
    choices: tags,
  })
  // console.log(repo, tag)
  // 下载模版后放到一个临时目录里，以备后续使用
  // download-git-repo
  const result = await waitFnLoading(download, 'download template')(repo, tag)
  console.log(result)
  // 拿到了下载的目录，直接拷贝到当前执行的目录下即可 ncp
  // path.resolve() 当前执行的目录
  // 把temlate下的文件，拷贝到执行命令的目录下
  // 如果有ask文件，需要渲染

  if (!fs.existsSync(path.join(result, 'ask.json'))) {
    await ncp(result, path.resolve(projectName))
    // 是否少了一个清空临时目录的操作？
  } else {
    console.log('复杂模版')
    // 复杂的需要模版渲染，渲染后再拷贝
    // 把git上的项目下载下来，如果有ask文件，就是一个复杂的模版，需要用户选择，然后编译
    // metalsmith 只要是模版编译都需要这个包
    // 让用户填信息
    await new Promise((resolve, reject) => {
      MetalSmith(__dirname) // 如果你传入路径，它默认会遍历当前目录下的src文件夹
        .source(result)
        .destination(path.resolve(projectName))
        .use(async (files, metal, done) => {
          console.log(files)
          const args = require(path.join(result, 'ask.json'))
          const info = await Inquirer.prompt(args)
          console.log(info) // 用户填写的结果
          const meta = metal.metadata()
          Object.assign(meta, info)
          delete files['ask.json']
          done()
        })
        .use((files, metal, done) => {
          const obj = metal.metadata()
          Reflect.ownKeys(files).forEach(async (file) => {
            if (file.includes('js') || file.includes('json')) {
              let content = files[file].contents.toString()
              if (content.includes('<%')) {
                content = await render(content, obj)
                files[file].contents = Buffer.from(content) // 渲染
              }
            }
          })
          console.log(metal.metadata())
          done()
        })
        .build((err) => {
          if (err) {
            reject()
          } else {
            resolve()
          }
        })
    })
    // 根据用户填的信息渲染模版
  }
}
