import * as dotenv from 'dotenv';
import { Update } from 'telegraf/typings/core/types/typegram';
import { Context, Middleware, Scenes, Telegraf, session } from 'telegraf';

import { scenes } from './scenes';
import { handlers } from './handlers';
import { middlewares } from './middlewares';
import { ConversationSessionData } from './types/misc';
import { HandlerDefinition, HandlerType } from './types/handlers';

dotenv.config();

interface WooFinderBotConfig {
    botToken: string;
    handlers: HandlerDefinition[];
    middlewares: Middleware<Context<Update>>[];
    scenes: Scenes.WizardScene<Scenes.WizardContext<ConversationSessionData>>[];
}

class WooFinderBot {
    private readonly bot: Telegraf<Scenes.WizardContext<ConversationSessionData>>;

    constructor (private readonly config: WooFinderBotConfig) {
        this.bot = new Telegraf(this.config.botToken);

        const stage = new Scenes.Stage<Scenes.WizardContext<ConversationSessionData>>(this.config.scenes);

        this.bot.use(session());
        this.bot.use(stage.middleware());

        for (const middleware of this.config.middlewares) {
            this.bot.use(middleware);
        }

        this.registerHandlers(this.config.handlers);
    }

    private registerHandlers(handlers: HandlerDefinition[]) {
        const commandsToAdd = [];

        for (const handler of handlers) {
            switch (handler.type) {
                case HandlerType.ACTION:
                    this.bot.action(handler.trigger, handler.callback);
                    break;

                case HandlerType.COMMAND:
                    commandsToAdd.push({
                        name: handler.name,
                        command: handler.command,
                        description: handler.description || 'No description provided.',
                    });
                    this.bot.command(handler.command, handler.callback);
                    break;

                default:
                    break;
            }
        }

        this.bot.telegram.setMyCommands(commandsToAdd);
    }

    public launch() {
        this.bot.launch();
    }
}

const bot = new WooFinderBot({
    botToken: process.env.BOT_TOKEN as string,
    scenes,
    handlers,
    middlewares,
});

bot.launch();