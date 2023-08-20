import { Update } from 'typegram';
import { handlers } from './handlers';
import { Context, Telegraf } from 'telegraf';
import { HandlerDefinition } from './types/handlers';

interface WooFinderBotConfig {
    botToken: string;
    handlers: HandlerDefinition[];
};

class WooFinderBot {
    private readonly bot: Telegraf<Context<Update>>;

    constructor (private readonly config: WooFinderBotConfig) {
        this.bot = new Telegraf(config.botToken);
        this.registerHandlers(config.handlers);
    }

    private registerHandlers(handlers: HandlerDefinition[]) {
        const handlersMetadata = handlers.map(handler => ({
            name: handler.command,
            command: handler.command,
            description: handler.description || 'No description available.',
        }))
        this.bot.telegram.setMyCommands(handlersMetadata);

        for (const handler of handlers) {
            this.bot.command(handler.command, handler.callback);
            this.bot.action('pet_register', async (ctx) => {
                console.log('Pet registration!');
            });
        }
    }

    public launch() {
        this.bot.launch();
    }
}

const bot = new WooFinderBot({
    botToken: '6130980585:AAH1uxGjX_ZI5tQBGV5s8c7eZ-1fM1aSmCE',
    handlers,
});

bot.launch();