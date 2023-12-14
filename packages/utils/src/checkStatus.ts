import path from 'path';
import { serialExec } from './exec';
import { fileIsExist } from './fs';
import logger from './logger';
import to from './to';

export const checkConfigStatus = () => {
    const filePath = process.cwd() + '/lania.config.json';
    const isExist = fileIsExist(filePath);
    if (!isExist) {
        logger.error('An error occurred(配置文件不存在)', true);
    }
    const extName = path.extname(filePath);
    if (extName !== '.json') {
        logger.error('An error occurred(配置文件正确)', true);
    }
    return true;
};

export const checkGitStatus = async () => {
    const [err] = await to(serialExec('git --version'));
    if (err) {
        logger.error('An error occurred(您没有安装git)', true);
    }
    return true;
};

export const checkGitInitStatus = async () => {
    const [err] = await to(serialExec('git status'));
    if (err) {
        logger.error('An error occurred(您还没有初始化git仓库)', true);
    }
    return true;
};

export const checkoutGitRemoteStatus = async () => {
    const [err, res] = await to(serialExec('git remote -v'));
    if (err) {
        logger.error('An error occurred(查询git远程仓库信息失败)', true);
    }
    if (!res?.data) {
        logger.error('An error occurred(您还没有绑定远程仓库)', true);
    }
    return { status: true, remotes: res?.data };
};
