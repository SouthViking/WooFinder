/* eslint-disable @typescript-eslint/no-explicit-any */
import { Scenes } from 'telegraf';

import { ConversationSessionData } from '../types';

export const sendSceneLeaveText = async (context: Scenes.WizardContext<ConversationSessionData>) => {
    context.reply('🐾 The operation has been cancelled 🐾');
};

/**
 * Checks the update type of the reply and determines whether it matches the expected text.
 * @param context The telegram context to get the reply from.
 * @param expected The expected text of the user reply.
 * @returns Whether the text matches the expected text in a **case insensitive way**.
 */
export const replyMatchesText = (context: Scenes.WizardContext<ConversationSessionData>, expected: string) => {
    let text: string = '';

    switch (context.updateType) {
        case 'callback_query':
            text = (context.update as any).callback_query.data;
            break;
        case 'message':
            text = (context.update as any).message.text;
            break;
        default:
            break;
    }

    if (!text) {
        return false;
    }

    return text.toLowerCase() === expected;
}