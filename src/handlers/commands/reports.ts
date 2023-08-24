import { Markup } from 'telegraf';
import { CommandHandlerDefinition, HandlerType } from '../../types';

export const reportsMenu: CommandHandlerDefinition = {
    type: HandlerType.COMMAND,
    name: 'Reports menu',
    command: 'reports',
    description: 'Displays the list of available options for lost pet reports',
    callback: async (context) => {
        context.reply('<b>🔎 Lost pet reports 🔎</b>', {
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('My reports', 'my_reports'), Markup.button.callback('See other\'s reports', 'see_others_reports')],
            ]),
        });
    },
};