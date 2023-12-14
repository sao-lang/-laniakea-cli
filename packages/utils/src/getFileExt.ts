import { TemplateOptions } from './types';

export const getFileExt = (options: TemplateOptions) => {
    const frameExtMap: Record<string, string[]> = {
        vue: ['vue'],
        react: ['tsx', 'jsx'],
        svelte: ['svelte'],
        astro: ['astro'],
        solid: ['tsx', 'jsx'],
        preact: ['tsx', 'jsx'],
    };
    const cssProcessorExtMap: Record<string, string[]> = {
        sass: ['scss'],
        less: ['less'],
        stylus: ['styl'],
    };
    const { frame, cssProcessor } = options;
    const frameExt = [...(frameExtMap[frame] || []), 'ts', 'js'];
    const cssProcessorExt = [...(cssProcessorExtMap[cssProcessor] || []), 'css'];
    return {
        js: frameExt,
        css: cssProcessorExt,
        other: ['json', 'md'],
    };
};

export default getFileExt;