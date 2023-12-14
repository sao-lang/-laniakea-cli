import {
    type TemplatePlugin,
    type TemplateOptions,
    type BuildTool,
    type CodeType,
    getAnAvailablePort,
} from '@laniakea-cli/utils';
import path from 'path';

export default class SpaReact implements TemplatePlugin {
    private resolve(targetPath: string) {
        return path.resolve(__dirname, targetPath);
    }
    public getDependenciesArray(options: TemplateOptions) {
        const dependenciesArray = ['react', 'react-dom'];
        const devDependenciesArray: string[] = options.buildTools as BuildTool[];
        if (options.useTs) {
            devDependenciesArray.push(
                '@types/react',
                '@types/react-dom',
                'typescript',
                '@types/node',
            );
        }
        if (options.useCssProcessor) {
            devDependenciesArray.push(options.cssProcessor);
        }
        if (options.buildTools.includes('webpack')) {
            const isNotTailwindcss =
                options.useCssProcessor && options.cssProcessor !== 'tailwindcss';
            devDependenciesArray.push(
                ...[
                    'webpack-cli',
                    '@babel/plugin-transform-runtime',
                    '@babel/runtime',
                    '@babel/preset-env',
                    '@babel/core',
                    options.useTs ? '@babel/preset-typescript' : '',
                    'webpack',
                    'webpack-cli',
                    'html-webpack-plugin',
                    'mini-css-extract-plugin',
                    'babel-loader',
                    'copy-webpack-plugin',
                    'cross-env',
                    'css-loader',
                    'css-minimizer-webpack-plugin',
                    'style-loader',
                    'webpack-dev-server',
                    'webpackbar',
                    'postcss',
                    'postcss-loader',
                    'postcss-preset-env',
                    '@pmmmwh/react-refresh-webpack-plugin',
                    '@babel/preset-react',
                    'webpack-bundle-analyzer',
                    'react-refresh',
                    '@types/estree',
                    isNotTailwindcss ? `${options.cssProcessor}-loader` : '',
                    'thread-loader',
                ].filter(Boolean),
            );
        }
        if (options.buildTools.includes('vite')) {
            devDependenciesArray.push(
                '@vitejs/plugin-react',
                'vite-plugin-compression',
                'terser',
                'rollup-plugin-visualizer',
            );
        }
        if (options.cssProcessor === 'tailwindcss') {
            devDependenciesArray.push('tailwindcss', 'postcss', 'autoprefixer');
        }
        return {
            dependencies: dependenciesArray,
            devDependencies: devDependenciesArray,
        };
    }
    public getOutputFileTasks(options: TemplateOptions) {
        const { useTs, cssProcessor } = options;
        const jsxExtName = (useTs ? 'tsx' : 'jsx') as CodeType;
        const jsExtName = (useTs ? 'ts' : 'js') as CodeType;
        const cssExtMap = {
            sass: 'scss',
            stylus: 'styl',
            less: 'less',
            tailwindcss: 'css',
        };
        const cssExtName = (cssExtMap?.[cssProcessor] ?? 'css;') as CodeType;
        return [
            () => {
                return {
                    templatePath: this.resolve('./ejs/spa/react/package.json.ejs'),
                    fileName: 'package.json',
                    options,
                    fileType: 'json',
                    outputPath: '/package.json',
                };
            },
            () => {
                return {
                    templatePath: this.resolve(`./ejs/spa/react/App.${jsxExtName}.ejs`),
                    fileName: `App.${jsxExtName}`,
                    options,
                    fileType: jsxExtName,
                    outputPath: `/src/App.${jsxExtName}`,
                };
            },
            () => {
                const jsxExtName = (options.useTs ? 'tsx' : 'jsx') as CodeType;
                return {
                    templatePath: this.resolve(`./ejs/spa/react/main.${jsxExtName}.ejs`),
                    fileName: `main.${jsxExtName}`,
                    options,
                    fileType: jsxExtName,
                    outputPath: `/src/main.${jsxExtName}`,
                };
            },
            () => {
                return {
                    templatePath: this.resolve(`./ejs/spa/react/App.${cssExtName}.ejs`),
                    fileName: `App.${cssExtName}`,
                    options,
                    fileType:
                        !cssProcessor || cssProcessor === 'tailwindcss' ? 'css' : cssProcessor,
                    outputPath: `/src/App.${cssExtName}`,
                };
            },
            () => {
                return {
                    templatePath: this.resolve(`./ejs/spa/react/index.${cssExtName}.ejs`),
                    fileName: `index.${cssExtName}`,
                    options,
                    fileType:
                        !cssProcessor || cssProcessor === 'tailwindcss' ? 'css' : cssProcessor,
                    outputPath: `/src/index.${cssExtName}`,
                };
            },
            () => {
                return {
                    templatePath: this.resolve('./ejs/spa/react/vite-env.d.ts.ejs'),
                    fileName: 'vite-env.d.ts',
                    options,
                    fileType: 'ts',
                    outputPath: '/src/vite-env.d.ts',
                    hide: !options.buildTools.includes('vite'),
                };
            },
            async () => {
                const port = await getAnAvailablePort(8089);
                if (options.buildTools.includes('webpack')) {
                    return {
                        templatePath: this.resolve('./ejs/spa/react/webpack.config.js.ejs'),
                        fileName: 'webpack.config.js',
                        options: { port, ...options },
                        fileType: 'js',
                        outputPath: '/webpack.config.js',
                    };
                }
                return {
                    templatePath: this.resolve(`./ejs/spa/react/index.${cssExtName}.ejs`),
                    fileName: `index.${cssExtName}`,
                    options,
                    fileType:
                        !cssProcessor || cssProcessor === 'tailwindcss' ? 'css' : cssProcessor,
                    outputPath: `/src/index.${cssExtName}`,
                };
            },
            () => {
                return {
                    templatePath: this.resolve('./ejs/spa/react/lan.config.json.ejs'),
                    fileName: 'lan.config.json',
                    options,
                    fileType: 'json',
                    outputPath: '/lan.config.json',
                };
            },
            () => {
                return {
                    templatePath: this.resolve('./ejs/spa/react/index.html.ejs'),
                    fileName: 'index.html',
                    options,
                    fileType: 'html',
                    outputPath: '/index.html',
                };
            },
            () => {
                return {
                    templatePath: this.resolve('./ejs/spa/react/tsconfig.json.ejs'),
                    fileName: 'tsconfig.json',
                    options,
                    fileType: 'json',
                    outputPath: '/tsconfig.json',
                    hide: !options.useTs,
                };
            },
            () => {
                return {
                    templatePath: this.resolve('./ejs/spa/react/tailwind.config.js.ejs'),
                    fileName: 'tailwind.config.js',
                    options,
                    fileType: 'js',
                    outputPath: '/tailwind.config.js',
                    hide: options.cssProcessor !== 'tailwindcss',
                };
            },
            () => {
                return {
                    templatePath: this.resolve('./ejs/spa/react/tailwind.css.ejs'),
                    fileName: 'tailwind.css',
                    options,
                    fileType: 'css',
                    outputPath: '/src/tailwind.css',
                    hide: options.cssProcessor !== 'tailwindcss',
                };
            },
            () => {
                return {
                    templatePath: this.resolve('./ejs/spa/react/postcss.config.js.ejs'),
                    fileName: 'postcss.config.js',
                    options,
                    fileType: 'js',
                    outputPath: '/postcss.config.js',
                    hide: options.cssProcessor !== 'tailwindcss',
                };
            },
            () => {
                return {
                    templatePath: this.resolve('./ejs/spa/react/.env.development.ejs'),
                    fileName: '.env.development',
                    options,
                    fileType: 'other',
                    outputPath: '/env/.env.development',
                    hide: !options.buildTools.includes('vite'),
                };
            },
            () => {
                return {
                    templatePath: this.resolve('./ejs/spa/react/.env.production.ejs'),
                    fileName: '.env.production',
                    options,
                    fileType: 'other',
                    outputPath: '/env/.env.production',
                    hide: !options.buildTools.includes('vite'),
                };
            },
            () => {
                return {
                    templatePath: this.resolve(`./ejs/spa/react/config.${jsExtName}.ejs`),
                    fileName: `config.${jsExtName}`,
                    options,
                    fileType: jsExtName,
                    outputPath: `/src/config/index.${jsExtName}`,
                };
            },
        ] as (() => {
            templatePath: string;
            fileName: string;
            options: Record<string, any>;
            fileType: CodeType;
            outputPath: string;
        })[];
    }
}
