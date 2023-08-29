import * as dotenv from 'dotenv';
import { Update } from 'telegraf/typings/core/types/typegram';
import { Context, Middleware, Scenes, Telegraf, session } from 'telegraf';

import { scenes } from './scenes';
import { handlers } from './handlers';
import { middlewares } from './middlewares';
import { ConversationSessionData } from './types/misc';
import { HandlerDefinition, HandlerType } from './types/handlers';

// Since some of the main credentials exist within .env files, this allows to use them.
dotenv.config();

interface WooFinderBotConfig {
    botToken: string;
    /** The aggregation of all the available handlers in the bot to be registered in it. */
    handlers: HandlerDefinition[];
    /** The aggregation of all the available middlewares to register.  */
    middlewares: Middleware<Context<Update>>[];
    /** The aggregation of all the scenes to register. (Scenes can be seen as 'forms', providing interaction with the user in both sides) */
    scenes: Scenes.WizardScene<Scenes.WizardContext<ConversationSessionData>>[];
}

class WooFinderBot {
    private readonly bot: Telegraf<Scenes.WizardContext<ConversationSessionData>>;

    constructor (private readonly config: WooFinderBotConfig) {
        this.bot = new Telegraf(this.config.botToken);

        const stage = new Scenes.Stage<Scenes.WizardContext<ConversationSessionData>>(this.config.scenes);

        // Session is needed, so the data can be stored and passed through the different steps of the scenes.
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

    public stop(reason: string | undefined) {
        this.bot.stop(reason);
    }
}

const bot = new WooFinderBot({
    botToken: process.env.BOT_TOKEN as string,
    scenes,
    handlers,
    middlewares,
});

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));