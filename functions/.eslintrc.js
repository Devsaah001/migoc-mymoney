/* eslint-env node */
module.exports = {
  root: true,
  env: {
    node: true,
    commonjs: true,
    es2021: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'script',
  },
  ignorePatterns: [
    'node_modules/',
  ],
  rules: {},
};