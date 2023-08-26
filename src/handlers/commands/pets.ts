import { Markup } from 'telegraf';

import { CommandHandlerDefinition, HandlerType, TriggerType } from '../../types';

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
                    Markup.button.callback('Register new pet', TriggerType.PET_REGISTER),
                    Markup.button.callback('Update pet', TriggerType.PET_UPDATE),
                ],
                [
                    Markup.button.callback('Remove pet', TriggerType.PET_REMOVE),
                    Markup.button.callback('Register pet owner', TriggerType.PET_OWNER_REGISTER),
                ],
                [
                    Markup.button.callback('Create lost report', TriggerType.PET_CREATE_LOST_REPORT),
                ]
            ]),
        });
    },
};