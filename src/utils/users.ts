import { Context } from 'telegraf';

import { Storage } from '../db';
import { UserDocument } from '../types/models';

export const ensureUserExists = async (context: Context, storage: Storage) => {
    const telegramUserData = context.from;
    if (!telegramUserData) {
        // Not expected to happen. The 'User' object should be always defined when this function is used.
        throw new Error('Telegram user data not defined. Cannot ensure if user exists.');
    }

    const usersCollection = storage.getCollection<UserDocument>('users');

    // Upsert the user, since their information can change. Only store 'createdAt' the first time without replacing it.
    await usersCollection.updateOne({ _id: telegramUserData.id }, {
        $set: {
            firstName: telegramUserData.first_name,
            lastName: telegramUserData.last_name,
            isBot: telegramUserData.is_bot,
            isPremium: telegramUserData.is_premium ?? false,
            languageCode: telegramUserData.language_code,
            username: telegramUserData.username,
        },
        $setOnInsert: {
            createdAt: Date.now(),
        },
    }, { upsert: true });
};