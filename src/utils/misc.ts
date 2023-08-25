import { Markup } from 'telegraf';
import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';

import { KeyboardButtonData } from '../types';

/**
 * @param buttons A list containing the information for the button creation.
 * @param buttonsPerRow The number of buttons per each row.
 * @returns A Telegram keyboard with buttons.
 */
export const generateTelegramKeyboardWithButtons = (buttons: KeyboardButtonData[], buttonsPerRow: number) => {
    const keyboard: InlineKeyboardButton.CallbackButton[][] = [];

    let row: InlineKeyboardButton.CallbackButton[] = [];
    for (const button of buttons) {
        if (row.length >= buttonsPerRow) {
            keyboard.push(row);
            row = [];
        }
        row.push(Markup.button.callback(button.text, button.data, button.hide));
    }

    if (row.length) {
        keyboard.push(row);
    }

    return keyboard;
};