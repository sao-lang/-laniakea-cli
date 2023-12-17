import { dirIsEmpty, logger } from '@laniakea-cli/utils';
import Template from './templates';

type ActionRecord = { type?: string; name?: string };

export default class Builder {
    private template: Template;
    private cliArgs: (string | boolean)[];
    public async init(actionRecord: ActionRecord) {
        const { name } = actionRecord;
        const { message, status } = this.checkOnInit();
        if (!status) {
            logger.error(message, true);
        }
        this.template = new Template();
        await this.template.prompt({ name });
        await this.build();
    }

    async build() {
        await this.template.getDependencies();
        await this.template.outputFiles();
        await this.template.downloadDependencies();
    }

    private checkOnInit() {
        if (!dirIsEmpty(process.cwd())) {
            return {
                message: '工作目录不为空！',
                status: false,
            };
        }
        return {
            message: '',
            status: true,
        };
    }
}
