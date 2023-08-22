import { Scenes } from 'telegraf';

import { ConversationSessionData } from '../types';

export const sendSceneLeaveText = async (context: Scenes.WizardContext<ConversationSessionData>) => {
    context.reply('🐾 The operation has been cancelled 🐾');
};