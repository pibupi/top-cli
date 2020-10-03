module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
    node: true,
    es6: true,
  },
  extends: ['airbnb-base'],
  parserOptions: {
    ecmaVersion: 12,
  },
  rules: {
    'no-console': 'off',
    semi: [
      'error',
      'never', // 改成代码结尾不再加分号，加了分号报错，不加分号不报错
    ],
  },
}
