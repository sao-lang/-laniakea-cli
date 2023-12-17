import {
    type BuildTool,
    codeFormat,
    getDependency,
    loading,
    logger,
    PACKAGE_TOOLS,
    PROJECT_TYPE_FRAMES_MAP,
    PROJECT_TYPES,
    readFile,
    serialExec,
    type TemplateOptions,
    type TemplatePlugin,
    to,
    writeFile,
    type CodeType,
} from '@laniakea-cli/utils';
import inquirer, { Answers } from 'inquirer';
import path from 'path';
import ejs from 'ejs';

import SpaReact from './spa/react';
import SpaVue from './spa/vue';
import SpaSvelte from './spa/svelte';

type Dependency = {
    dependencies: string[];
    devDependencies: string[];
};

const switchPlugin = (type: string, frame: string) => {
    if (type === 'spa') {
        switch (frame) {
            case 'vue': {
                return SpaVue;
            }
            case 'react': {
                return SpaReact;
            }
            case 'svelte': {
                return SpaSvelte;
            }
            default: {
                logger.error('目前不支持这种框架', true);
            }
        }
    }
    logger.error('目前不支持这种框架', true);
};

export default class TemplateBase {
    private options: TemplateOptions;
    private dependencies: Record<string, string> = {};
    private devDependencies: Record<string, string> = {};
    private plugin: TemplatePlugin;
    constructor() {}
    public async prompt({ name }: { name?: string }) {
        this.options = { name } as TemplateOptions;

        const choices: Answers = [
            {
                type: 'input',
                message: '请输入项目名称:',
                name: 'name',
                default: path.basename(process.cwd()),
                hide: !!name,
            },
            {
                type: 'list',
                message: '请选择项目类型:',
                name: 'type',
                choices: PROJECT_TYPES,
            },
            {
                name: 'frame',
                message: '请选择项目框架:',
                type: 'list',
                choices: ({ type }: { type: string }) => {
                    return PROJECT_TYPE_FRAMES_MAP[type];
                },
                when: ({ type }: { type: string }) => {
                    if (['vanilla', 'toolkit'].includes(type)) {
                        return false;
                    }
                    return true;
                },
            },
            // {
            //     type: 'confirm',
            //     message: '是否使用ts?',
            //     name: 'useTs',
            // },
            {
                type: 'confirm',
                message: '是否使用css预处理器?',
                name: 'useCssProcessor',
                when: ({ type }: { type: string }) => {
                    if (['toolkit', 'nodejs'].includes(type)) {
                        return false;
                    }
                    return true;
                },
            },
            {
                type: 'list',
                message: '请选择css处理器:',
                name: 'cssProcessor',
                choices: ['sass', 'less', 'stylus', 'tailwindcss'],
                default: 'sass',
                when: ({ useCssProcessor }: { useCssProcessor: boolean }) => {
                    return useCssProcessor;
                },
            },
            // {
            //     type: 'confirm',
            //     message: '是否使用lint工具?',
            //     name: 'useLintTools',
            // },
            // {
            //     type: 'checkbox',
            //     message: '请选择lint工具:',
            //     name: 'lintTools',
            //     choices: LINT_TOOLS,
            //     default: ['eslint', 'prettier'],
            //     when: ({ useLintTools }: { useLintTools: boolean }) => {
            //         return useLintTools;
            //     },
            // },
            // {
            //     type: 'confirm',
            //     message: '是否开启单元测试?',
            //     name: 'useUnitTest',
            // },
            {
                name: 'buildTools',
                type: 'list',
                message: '请选择构建工具:',
                choices: ['webpack', 'vite'],
                when: ({ type }: { type: string }) => {
                    return ['spa', 'ssr', 'nodejs', 'vanilla'].includes(type);
                },
            },
            {
                name: 'buildTools',
                type: 'checkbox',
                message: '请选择构建工具:',
                choices: ['rollup', 'gulp'],
                when: ({ type }: { type: string }) => {
                    return ['toolkit', 'components'].includes(type);
                },
            },
            {
                name: 'packageTool',
                type: 'list',
                message: '请选择打包工具:',
                choices: PACKAGE_TOOLS,
            },
        ];
        const [err, result] = (await to(inquirer.prompt(choices))) as [
            Error | undefined,
            TemplateOptions,
        ];
        if (err) {
            logger.error('项目创建失败!', true);
        }
        if (['toolkit', 'components'].includes(result.type)) {
            result.useDocFrame = true;
            result.docFrame = 'vitepress';
        }
        if (['spa'].includes(result.type)) {
            result.buildTools = [result.buildTools as BuildTool];
        }
        if (result.useUnitTest) {
            result.unitTestTool = 'vitest';
        }
        result.useTs = true;
        this.plugin = new (switchPlugin(result.type, result.frame))();
        this.options = result;
    }
    public async getDependencies() {
        const { dependencies, devDependencies } = this.plugin.getDependenciesArray(
            this.options,
        ) as Dependency;
        await loading('依赖解析中', async () => {
            const [dependenciesErr, dependenciesMap] = await to(getDependency(dependencies));
            if (dependenciesErr) {
                return {
                    status: 'fail',
                    message: '解析依赖失败',
                    error: dependenciesErr,
                };
            }
            const [devDependenciesErr, devDependenciesMap] = await to(
                getDependency(devDependencies),
            );
            if (devDependenciesErr) {
                return {
                    status: 'fail',
                    message: '解析依赖失败',
                    error: dependenciesErr,
                };
            }
            this.dependencies = dependenciesMap;
            this.devDependencies = devDependenciesMap;
            return {
                status: 'succeed',
                message: '解析依赖成功',
                error: null,
            };
        });
    }
    public async outputFiles() {
        const tasks = this.plugin.getOutputFileTasks({
            ...this.options,
        });
        for (const task of tasks) {
            const { templatePath, fileType, outputPath, options, hide } = await task();
            if (hide) {
                continue;
            }
            const filePath = (process.cwd() + outputPath).replace(/\\/g, '/');
            await loading(`创建${filePath}中`, async () => {
                const [readFileErr, content] = await to(readFile(templatePath));
                if (readFileErr) {
                    return {
                        status: 'fail',
                        message: `${filePath}创建失败`,
                        error: readFileErr,
                    };
                }
                const templateCode = ejs.render(content, {
                    ...options,
                    dependencies: this.dependencies,
                    devDependencies: this.devDependencies,
                });
                const [formatErr, code] = await to(codeFormat(templateCode, fileType as CodeType));
                if (formatErr) {
                    return {
                        status: 'fail',
                        message: `${filePath}创建失败`,
                        error: formatErr,
                    };
                }
                const [writeFileErr] = await to(writeFile(code, process.cwd() + outputPath));
                if (writeFileErr) {
                    return {
                        status: 'fail',
                        message: `${filePath}创建失败`,
                        error: writeFileErr,
                    };
                }
                return {
                    status: 'succeed',
                    message: `${filePath}创建成功`,
                    error: null,
                };
            });
        }
    }
    public async downloadDependencies() {
        const { packageTool, type, frame } = this.options;
        await loading('依赖下载中', async () => {
            const [installErr] = await to(
                serialExec({
                    command: `${packageTool} install --registry=https://registry.npmmirror.com`,
                    silent: true,
                }),
            );

            if (installErr) {
                return {
                    message: '依赖下载失败',
                    error: installErr,
                    status: 'fail',
                };
            }

            return {
                message: '依赖下载成功',
                error: null,
                status: 'succeed',
            };
        });

        logger.fig(`LANIAKEA   ${type.toUpperCase()}-${frame.toUpperCase()}`);
    }
}
