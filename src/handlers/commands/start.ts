import { storage } from '../../db';
import { ensureUserExists } from '../../utils';
import { CommandHandlerDefinition, HandlerType } from '../../types';

export const startHandlerDef: CommandHandlerDefinition = {
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

        await context.replyWithHTML(welcomeMessage);
    },
};