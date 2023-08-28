import { AppCollections, Storage } from '../db';
import { generateTelegramKeyboardWithButtons } from './misc';
import { KeyboardButtonData, PetData, PetDocument, SpeciesDocument } from '../types';

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
    const species = await storage.findAndGetAll<SpeciesDocument>(AppCollections.SPECIES, {});
    const speciesMap: Record<string, string> = {}; 
    for (const speciesDoc of species) {
        speciesMap[speciesDoc._id.toString()] = speciesDoc.name;
    }

    const userPets: KeyboardButtonData[] = (await storage.findAndGetAll<PetDocument>(AppCollections.PETS, { 'owners.0': userId })).map(petDoc => {
        const petEmoji = getPetEmojiForSpeciesName(speciesMap[petDoc.species.toString()]);
        return {
            text: petEmoji.length !== 0 ? `${petEmoji} ${petDoc.name}` : petDoc.name,
            data: petDoc._id.toString(),
        };
    });

    return generateTelegramKeyboardWithButtons(userPets, 2);
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