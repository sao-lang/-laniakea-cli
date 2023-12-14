import {
    type TemplatePlugin,
    type TemplateOptions,
    type BuildTool,
    type CodeType,
    getAnAvailablePort,
} from '@laniakea-cli/utils';
import path from 'path';

export default class SpaSvelte implements TemplatePlugin {
    private resolve(targetPath: string) {
        return path.resolve(__dirname, targetPath);
    }
    public getDependenciesArray(options: TemplateOptions) {
        const dependenciesArray: string[] = ['svelte'];
        const devDependenciesArray: string[] = options.buildTools as BuildTool[];
        if (options.useTs) {
            devDependenciesArray.push('typescript', '@types/node');
        }
        if (options.useCssProcessor) {
            devDependenciesArray.push(options.cssProcessor);
        }
        if (options.buildTools.includes('webpack')) {
            const isNotTailwindcss =
                options.useCssProcessor && options.cssProcessor !== 'tailwindcss';
            devDependenciesArray.push(
                ...[
                    'svelte-loader',
                    'svelte-preprocess',
                    '@babel/core',
                    '@babel/preset-env',
                    'babel-loader',
                    'copy-webpack-plugin',
                    'cross-env',
                    'css-loader',
                    'css-minimizer-webpack-plugin',
                    'html-webpack-plugin',
                    'mini-css-extract-plugin',
                    'postcss-preset-env',
                    'webpack',
                    'webpack-cli',
                    'webpack-dev-server',
                    'postcss-loader',
                    'webpack-bundle-analyzer',
                    'style-loader',
                    ...(options.useTs ? ['ts-loader', '@babel/preset-typescript'] : []),
                    isNotTailwindcss ? `${options.cssProcessor}-loader` : '',
                    'thread-loader',
                ].filter(Boolean),
            );
        }
        if (options.buildTools.includes('vite')) {
            devDependenciesArray.push(
                'svelte-check',
                '@sveltejs/vite-plugin-svelte',
                'tslib',
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
                    templatePath: this.resolve('./ejs/spa/svelte/package.json.ejs'),
                    fileName: 'package.json',
                    options,
                    fileType: 'json',
                    outputPath: '/package.json',
                };
            },
            () => {
                return {
                    templatePath: this.resolve('./ejs/spa/svelte/App.svelte.ejs'),
                    fileName: 'App.svelte',
                    options,
                    fileType: 'svelte',
                    outputPath: '/src/App.svelte',
                };
            },
            () => {
                return {
                    templatePath: this.resolve(`./ejs/spa/svelte/main.${jsExtName}.ejs`),
                    fileName: `main.${jsExtName}`,
                    options,
                    fileType: jsExtName,
                    outputPath: `/src/main.${jsExtName}`,
                };
            },
            () => {
                return {
                    templatePath: this.resolve(`./ejs/spa/svelte/App.${cssExtName}.ejs`),
                    fileName: `App.${cssExtName}`,
                    options,
                    fileType:
                        !cssProcessor || cssProcessor === 'tailwindcss' ? 'css' : cssProcessor,
                    outputPath: `/src/App.${cssExtName}`,
                };
            },
            () => {
                return {
                    templatePath: this.resolve(`./ejs/spa/svelte/index.${cssExtName}.ejs`),
                    fileName: `index.${cssExtName}`,
                    options,
                    fileType:
                        !cssProcessor || cssProcessor === 'tailwindcss' ? 'css' : cssProcessor,
                    outputPath: `/src/index.${cssExtName}`,
                };
            },
            () => {
                return {
                    templatePath: this.resolve('./ejs/spa/svelte/vite-env.d.ts.ejs'),
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
                        templatePath: this.resolve('./ejs/spa/svelte/webpack.config.js.ejs'),
                        fileName: 'webpack.config.js',
                        options: { port, ...options },
                        fileType: 'js',
                        outputPath: '/webpack.config.js',
                    };
                }
                return {
                    templatePath: this.resolve(`./ejs/spa/svelte/vite.config.${jsExtName}.ejs`),
                    fileName: `vite.config.${jsExtName}`,
                    options: { port, ...options },
                    fileType: jsExtName,
                    outputPath: `/vite.config.${jsExtName}`,
                };
            },
            () => {
                return {
                    templatePath: this.resolve('./ejs/spa/svelte/lan.config.json.ejs'),
                    fileName: 'lan.config.json',
                    options,
                    fileType: 'json',
                    outputPath: '/lan.config.json',
                };
            },
            () => {
                return {
                    templatePath: this.resolve('./ejs/spa/svelte/index.html.ejs'),
                    fileName: 'index.html',
                    options,
                    fileType: 'html',
                    outputPath: '/index.html',
                };
            },
            () => {
                return {
                    templatePath: this.resolve('./ejs/spa/svelte/tsconfig.json.ejs'),
                    fileName: 'tsconfig.json',
                    options,
                    fileType: 'json',
                    outputPath: '/tsconfig.json',
                    hide: !options.useTs,
                };
            },
            () => {
                return {
                    templatePath: this.resolve('./ejs/spa/svelte/tailwind.config.js.ejs'),
                    fileName: 'tailwind.config.js',
                    options,
                    fileType: 'js',
                    outputPath: '/tailwind.config.js',
                    hide: options.cssProcessor !== 'tailwindcss',
                };
            },
            () => {
                return {
                    templatePath: this.resolve('./ejs/spa/svelte/tailwind.css.ejs'),
                    fileName: 'tailwind.css',
                    options,
                    fileType: 'css',
                    outputPath: '/src/tailwind.css',
                    hide: options.cssProcessor !== 'tailwindcss',
                };
            },
            () => {
                return {
                    templatePath: this.resolve('./ejs/spa/svelte/postcss.config.js.ejs'),
                    fileName: 'postcss.config.js',
                    options,
                    fileType: 'js',
                    outputPath: '/postcss.config.js',
                    hide: options.cssProcessor !== 'tailwindcss',
                };
            },
            () => {
                return {
                    templatePath: this.resolve('./ejs/spa/svelte/.env.development.ejs'),
                    fileName: '.env.development',
                    options,
                    fileType: 'other',
                    outputPath: '/env/.env.development',
                    hide: !options.buildTools.includes('vite'),
                };
            },
            () => {
                return {
                    templatePath: this.resolve('./ejs/spa/svelte/.env.production.ejs'),
                    fileName: '.env.production',
                    options,
                    fileType: 'other',
                    outputPath: '/env/.env.production',
                    hide: !options.buildTools.includes('vite'),
                };
            },
            () => {
                return {
                    templatePath: this.resolve(`./ejs/spa/svelte/config.${jsExtName}.ejs`),
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
