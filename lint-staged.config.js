module.exports = {
  'package.json': ['fixpack'],
  'src/**/*.ts': ['eslint --cache --fix', 'prettier --ignore-unknown --write'],
};
