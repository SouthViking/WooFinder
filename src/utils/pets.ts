import { Markup } from 'telegraf';
import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';

import { Storage } from '../db';
import { PetData, PetDocument } from '../types';

const MIN_ALLOWED_BIRTHDATE = '2000-01-01';
const MIN_ALLOWED_BIRTHDATE_TIMESTAMP = Date.parse(MIN_ALLOWED_BIRTHDATE);

export const getPetEmojiForSpeciesName = (species: string) => {
    return {
        'dog': '🐶',
        'cat': '🐱',
    }[species.toLowerCase()] ?? '';
};

export const isValidBirthDate = (birthDate: number): {
    isValid: boolean;
    errorMessage?: string;
} => {
    if (birthDate < MIN_ALLOWED_BIRTHDATE_TIMESTAMP) {
        return { isValid: false, errorMessage: `Invalid birthdate. The date must be greater than ${MIN_ALLOWED_BIRTHDATE}.` };
    }

    if (birthDate > Date.now()) {
        return { isValid: false, errorMessage: 'Invalid birthdate. The date must be less than the current date.' };
    }

    return { isValid: true };
};

/**
 * Returns a Telegram keyboard based on the stored pets for the given `userId`.
 * Every button contains the ID of the pet as value.
 * @param userId The ID of the target user.
 * @param storage The storage object to get the collection of pets.
 */
export const getUserPetsListKeyboard = async (userId: number, storage: Storage) => {
    const petsCollection = storage.getCollection<PetDocument>('pets');
    const userPetsFilter = { 'owners.0': userId};

    const keyboard: InlineKeyboardButton.CallbackButton[][] = [];
    for await (const petDoc of petsCollection.find(userPetsFilter)) {
        keyboard.push([Markup.button.callback(`${petDoc.name}`, petDoc._id.toString())]);
    }

    return keyboard;
};

export const generatePetSummaryHTMLMessage = (petData: PetData) => {
    let summaryMessage = `🐾 Information about <b>${petData.name}</b> 🐾\n\n`;
    if (petData.otherNames) {
        summaryMessage += `· <b>Secondary names</b>: ${petData.otherNames.join(' - ')}\n`;
    }
    summaryMessage += `· <b>Date of birth</b>: ${new Date(petData.birthDate)}\n`;
    summaryMessage += `· <b>Size</b>: ${petData.size}\n`;
    summaryMessage += `· <b>Weight</b>: ${petData.weight} kg\n`;
    summaryMessage += `· <b>Description</b>: ${petData.description}\n`;

    return summaryMessage;
}