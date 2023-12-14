const { series } = require('gulp');
const { spawn } = require('child_process');
const fs = require('fs');
// const execa = require('execa');
const path = require('path');

const targets = fs.readdirSync('packages').filter((f) => {
    if (!fs.statSync(`packages/${f}`).isDirectory()) {
        return false;
    }
    return true;
});

const run = async (command) => {
    return new Promise((resolve) => {
        // 将命令分割 例如：rm -rf 分割为['rm', '-rf'],进行解构[cmd,...args]
        const [cmd, ...args] = command.split(' ');
        const app = spawn(cmd, args, {
            cwd: path.resolve(__dirname, '.'),
            stdio: 'inherit',
            shell: true, // 默认情况下 linux才支持 rm -rf  windows安装git bash
        });
        // 在进程已结束并且子进程的标准输入输出流已关闭之后，则触发 'close' 事件
        app.on('close', resolve); //
    });
};

const withTaskName = (name, fn) => {
    Object.assign(fn, { displayName: name });
    return fn;
};

const build = (target) => {
    return withTaskName(`build ${target}`, async () => {
        await run(`rimraf packages/${target}/dist`);
        await run(`rollup -c=rollup.config.js --environment TARGET:${target}`);
    });
};

const buildTsc = () => {
    return withTaskName('tsc', async () => {
        await run('rimraf temp');
        await run('tsc -p tsconfig.build.json');
    });
};

const buildDts = (target) => {
    return withTaskName(`build ${target}Dts`, async () => {
        await run(`rollup -c=rollup.dts.config.js --environment TARGET:${target}`);
    });
};

const clearTemp = () => {
    return withTaskName('clear temp', async () => {
        await run('rimraf temp');
    });
};

exports.build = series(
    series(...targets.map((target) => build(target))),
    buildTsc(),
    series(...targets.map((target) => buildDts(target))),
    clearTemp(),
);
