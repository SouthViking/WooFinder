import { Context } from 'telegraf';

import { UserDocument } from '../types/models';
import { AppCollections, Storage } from '../db';

/**
 * Executes an unpsert operation on the user record. If it is not created, then also adds the `createdAt` field.
 * @param context The Telegram bot context to get the user ID.
 * @param storage The storage definition to get the collection of users.
 */
export const ensureUserExists = async (context: Context, storage: Storage) => {
    const telegramUserData = context.from;
    if (!telegramUserData) {
        // Not expected to happen. The 'User' object should be always defined when this function is used.
        throw new Error('Telegram user data not defined. Cannot ensure if user exists.');
    }

    // TODO: Wrap the updateOne method within the storage class.
    const usersCollection = storage.getCollection<UserDocument>(AppCollections.USERS);
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