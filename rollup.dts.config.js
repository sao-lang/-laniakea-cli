const path = require('path');
const { dts } = require('rollup-plugin-dts');

const resolve = (p) =>
    path.resolve(path.resolve(path.resolve(__dirname, 'packages'), process.env.TARGET), p);
const pkgJson = require(resolve('package.json'));
const basePkgJson = require('./package.json');
const createConfig = () => {
    let external = [
        // ...Object.keys(basePkgJson.devDependencies || {}),
        ...Object.keys(basePkgJson.dependencies || {}),
    ];
    return {
        input: `temp/${pkgJson.buildOptions.name}/src/index.d.ts`,
        output: {
            file: resolve('dist/src/index.d.ts'),
            format: 'es',
        },
        external,
        plugins: [dts()],
    };
};
exports.default = createConfig();
