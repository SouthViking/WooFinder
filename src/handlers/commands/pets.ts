import { Markup } from 'telegraf';

import { CommandHandlerDefinition, HandlerType } from '../../types/handlers';

export const petsMenu: CommandHandlerDefinition = {
    type: HandlerType.COMMAND,
    name: 'Pets menu',
    command: 'pets',
    description: 'Displays the list of available options for pets.',
    callback: async (context) => {
        context.reply('<b>🐾 Pets menu 🐾</b>', {
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard([
                [
                    Markup.button.callback('Register new pet', 'pet_register'),
                    Markup.button.callback('Update pet', 'pet_update'),
                ],
                [
                    Markup.button.callback('Remove pet', 'pet_remove'),
                    Markup.button.callback('Register pet owner', 'pet_owner_register'),
                ]
            ]),
        });
    },
};