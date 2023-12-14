import Builder from '@laniakea-cli/builder';
import {
    fileIsExist,
    logger,
    startCommander,
    to,
    readFile,
    serialExec,
    Config,
    PROJECT_TYPES,
    BUILD_TOOLS,
    PROJECT_TYPE_FRAMES_MAP,
    FRAME_TYPES,
    APP_PROJECTS,
    APP_PROJECT_BUILD_TOOLS,
    TOOL_PROJECTS,
    TOOL_PROJECT_BUILD_TOOLS,
    getAnAvailablePort,
} from '@laniakea-cli/utils';
import { version, cli } from '../package.json';
import { CommandKey, registerCommand } from '@laniakea-cli/utils';
class Commander {
    private builder: Builder;
    constructor() {
        this.register();
    }
    private register() {
        startCommander(
            () => {
                this.create();
                this.dev();
                this.build();
            },
            { version, name: cli.name },
        );
    }

    private checkConfigOk(config: Config) {
        const { type, buildTools, frame } = config;
        if (!type || !PROJECT_TYPES.includes(type)) {
            return false;
        }
        if (
            !Array.isArray(buildTools) ||
            !buildTools.every((buildTool) => BUILD_TOOLS.includes(buildTool))
        ) {
            return false;
        }
        if (!(FRAME_TYPES.includes(type) && PROJECT_TYPE_FRAMES_MAP[type].includes(frame))) {
            return false;
        }
        if (
            !(
                APP_PROJECTS.includes(type) &&
                buildTools.every((buildTool) => !APP_PROJECT_BUILD_TOOLS.includes(buildTool))
            )
        ) {
            return false;
        }
        if (
            !(
                TOOL_PROJECTS.includes(type) &&
                buildTools.every((buildTool) => !TOOL_PROJECT_BUILD_TOOLS.includes(buildTool))
            )
        ) {
            return false;
        }
        return true;
    }

    private async loadConfigFile() {
        const configFilePath = process.cwd() + '/lan.config.json';
        if (!fileIsExist(configFilePath)) {
            logger.error('配置文件不存在', true);
        }
        const [configErr, content] = await to(readFile(configFilePath));
        if (configErr) {
            logger.error(`配置文件加载失败: ${configErr.message}`, true);
        }
        const config = JSON.parse(content) as Config;
        if (this.checkConfigOk(config)) {
            logger.error('参数错误', true);
        }
        return config;
    }
    private async create() {
        registerCommand(
            CommandKey.create,
            [
                // {
                //     value: '--type, [type]',
                //     description: 'Please select the type of project(请选择项目的类型)!',
                // },
                {
                    value: '--name, [name]',
                    description: '(请输入项目的名称)!',
                },
                // { value: `-ts --typescript`, description: 'Apply typescript(使用typescript)?' },
                // { value: `-q --quick, `, description: 'Create a project quickly!' },
            ],
            async (actionRecord: { name?: string; type?: string }) => {
                const builder = new Builder();
                builder.init(actionRecord);
            },
        );
    }
    private async dev() {
        registerCommand(CommandKey.dev, [], async () => {
            const config = await this.loadConfigFile();
            const map: Record<string, string> = {
                webpack: 'cross-env NODE_ENV=development webpack serve --config webpack.config.js',
                vite: 'npx vite',
            };
            const [devErr] = await to(
                serialExec({ command: `${map[config.buildTools[0]]}`, silent: false }),
            );
            if (devErr) {
                logger.error(`项目启动失败: ${devErr.message}`, true);
            }
        });
    }

    private build() {
        registerCommand(CommandKey.build, [], async () => {
            const config = await this.loadConfigFile();
            const { buildTools, frame, useTs } = config;
            let command = '';
            if (buildTools.includes('webpack')) {
                command = 'cross-env NODE_ENV=production webpack  --config webpack.config.js';
            } else if (buildTools.includes('vite')) {
                const map: Record<string, string> = {
                    vue: `${useTs ? 'npx vue-tsc && ' : ''}vite build`,
                    svelte: 'npx vite build',
                };
                command = map?.[frame] ?? `${useTs ? 'npx tsc && ' : ''}vite build`;
            } else {
                command = 'rollup --config rollup.config.js';
            }
            await to(
                serialExec({
                    command,
                    silent: false,
                }),
            );
        });
    }

    private lint() {}

    private add() {}
}

export default new Commander();
