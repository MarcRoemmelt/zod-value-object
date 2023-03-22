module.exports = {
    'package.json': ['fixpack'],
    'src/**/*.ts': () => {
        return [
            'eslint --cache --fix',
            'prettier --ignore-unknown --write'
        ];
    },
};
