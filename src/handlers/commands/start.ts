import { storage } from '../../db';
import { ensureUserExists } from '../../utils/users';
import { HandlerDefinition, HandlerType } from '../../types/handlers';

export const startHandlerDef: HandlerDefinition = {
    type: HandlerType.COMMAND,
    name: 'Start',
    command: 'start',
    description: 'Welcome message to the bot and registration.',
    callback: async (context) => {
        await ensureUserExists(context, storage);
        
        const displayName = context.from?.username ?? context.from?.first_name ?? 'user';
        const welcomeMessage = `
            🦴🐶 Hey <b>${displayName}</b>! Welcome to <b>WooFinder</b> 🐾🐱\nA telegram bot that helps you to find lost and found pets.\b
        `;

        context.replyWithHTML(welcomeMessage);
        context.reply('You can see the command list by typing /commands');
    },
};