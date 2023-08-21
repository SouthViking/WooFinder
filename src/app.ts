import { handlers } from './handlers';
import { ConversationSessionData } from './types/misc';
import { Scenes, Telegraf, session } from 'telegraf';
import { petRegistrationScene } from './scenes/pets/registration';
import { HandlerDefinition, HandlerType } from './types/handlers';

interface WooFinderBotConfig {
    botToken: string;
    handlers: HandlerDefinition[];
};

class WooFinderBot {
    private readonly bot: Telegraf<Scenes.WizardContext<ConversationSessionData>>;

    constructor (private readonly config: WooFinderBotConfig) {
        this.bot = new Telegraf(config.botToken);

        const stage = new Scenes.Stage<Scenes.WizardContext<ConversationSessionData>>([petRegistrationScene]);

        this.bot.use(session());
        this.bot.use(stage.middleware());

        this.registerHandlers(config.handlers);
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
    botToken: '6130980585:AAH1uxGjX_ZI5tQBGV5s8c7eZ-1fM1aSmCE',
    handlers,
});

bot.launch();