// import nodeResolve from '@rollup/plugin-node-resolve';
// import cjs from '@rollup/plugin-commonjs';
// import ts from 'rollup-plugin-typescript2';
// import json from '@rollup/plugin-json';
// import path from 'path';
const nodeResolve = require('@rollup/plugin-node-resolve');
const cjs = require('@rollup/plugin-commonjs');
const json = require('@rollup/plugin-json');
const ts = require('rollup-plugin-typescript2');
const polyfillNode = require('rollup-plugin-polyfill-node');
// const { dts } = require('rollup-plugin-dts');
const path = require('path');
const copy = require('rollup-plugin-copy');

const resolve = (p) =>
    path.resolve(path.resolve(path.resolve(__dirname, 'packages'), process.env.TARGET), p);

const pkgJson = require(resolve('package.json'));
const basePkgJson = require('./package.json');

const outputConfigs = {
    'esm-bundler': {
        file: resolve('dist/src/index.esm-bundler.js'),
        format: 'es',
    },
    cjs: {
        file: resolve('dist/src/index.cjs.js'),
        format: 'cjs',
    },
    // global: {
    //     file: resolve('dist/index.global.js'),
    //     format: 'iife',
    // },
};

const createConfig = (format, output) => {
    let external = [...Object.keys(basePkgJson.dependencies || {}), 'path', 'fs', 'net'];
    if (format === 'global') {
        // output.name = pkgJson.buildOptions.name;
    } else {
        let globals = {};
        external.forEach((item) => {
            globals[item] = item;
        });
        output.globals = globals;
        external = [...external, ...Object.keys(pkgJson.dependencies || {})];
    }
    return {
        input: resolve('src/index.ts'),
        output,
        external,
        plugins: [
            json(),
            ts({ tsconfig: './tsconfig.json' }),
            cjs(),
            nodeResolve({ preferBuiltins: true }),
            polyfillNode(),
            copy({
                targets: [
                    {
                        src: 'packages/builder/src/ejs/spa/*',
                        dest: 'packages/builder/dist/src/ejs/spa',
                    },
                ],
            }),
        ],
    };
};
const packageConfigs = pkgJson.buildOptions.formats;

module.exports = packageConfigs.map((format) => createConfig(format, outputConfigs[format]));
