import { Markup, Scenes as TelegrafScenes } from 'telegraf';

import { sendSceneLeaveText } from './scenes';
import { AppCollections, Storage, storage } from '../db';
import { generateTelegramKeyboardWithButtons } from './misc';
import { MAX_SECONDARY_PET_NAMES_ALLOWED } from '../validators/pets';
import { ConversationSessionData, KeyboardButtonData, PetData, PetDocument, SpeciesDocument } from '../types';

export const getPetEmojiForSpeciesName = (species: string) => {
    return {
        'dog': '🐶',
        'cat': '🐱',
    }[species.toLowerCase()] ?? '';
};


/**
 * Returns a Telegram keyboard based on the stored pets for the given `userId`.
 * Every button contains the ID of the pet as value.
 * @param userId The ID of the target user.
 * @param storage The storage object to get the collection of pets.
 */
export const getUserPetsListKeyboard = async (storage: Storage, userId: number) => {
    const userPets = await getUserPets(storage, userId, ['_id', 'name', 'species']);
    const species = await storage.findAndGetAllAsObject<SpeciesDocument>(AppCollections.SPECIES, {});

    const buttons: KeyboardButtonData[] = [];
    for (const petId in userPets) {
        const petDoc = userPets[petId];
        const petEmoji = getPetEmojiForSpeciesName(species[petDoc.species.toString()].name);
        
        buttons.push({ text: petEmoji.length !== 0 ? `${petEmoji} ${petDoc.name}` : petDoc.name, data: petDoc._id.toString() });
    }

    return generateTelegramKeyboardWithButtons(buttons, 2);
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

export const sendPetNameRegistrationMessage = async (context: TelegrafScenes.WizardContext<ConversationSessionData>) => {
    await context.reply('Please enter the name of your pet');
};

export const sendPetOtherNamesRegistrationMessage = async (context: TelegrafScenes.WizardContext<ConversationSessionData>) => {
    let instructionsMessage = 'Sometimes pets have more than one name that they can recognize. ';
    instructionsMessage += `Please enter a list of secondary names separated by a space (max ${MAX_SECONDARY_PET_NAMES_ALLOWED}), send <b>"no"</b> otherwise.`;

    await context.reply(instructionsMessage, { parse_mode: 'HTML' });
};

export const sendBirthDateRegistrationMessage = async (context: TelegrafScenes.WizardContext<ConversationSessionData>) => {
    await context.reply('Enter pet\'s birthdate (format: <b>yyyy-mm-dd</b>)', { parse_mode: 'HTML' });
};

export const sendSpeciesRegistrationMessage = async (context: TelegrafScenes.WizardContext<ConversationSessionData>) => {
    const species = await storage.findAndGetAll<SpeciesDocument>(AppCollections.SPECIES, {});
        if (species.length === 0) {
            context.reply('⚠️ There are no species available right now for pet registration. Please try again later!');
            sendSceneLeaveText(context);
            return context.scene.leave();
        }

        const buttons: KeyboardButtonData[] = species.map(speciesDoc => {
            const petEmoji = getPetEmojiForSpeciesName(speciesDoc.name);
            return {
                text: `${petEmoji ? `${petEmoji} ` : ''}${speciesDoc.name}`,
                data: speciesDoc._id.toString(),
            }
        });
        const keyboard = generateTelegramKeyboardWithButtons(buttons, 2);

        await context.reply('Select the pet species', { ...Markup.inlineKeyboard(keyboard) });
};

export const sendSizeRegistrationMessage = async (context: TelegrafScenes.WizardContext<ConversationSessionData>) => {
    await context.reply('Please select the estimated size of your pet', { 
        ...Markup.inlineKeyboard([
            [Markup.button.callback('small', 'small'), Markup.button.callback('medium', 'medium')],
            [Markup.button.callback('large', 'large'), Markup.button.callback('giant', 'giant')]
        ]) ,
    });
};

export const sendWeightRegistrationMessage = async (context: TelegrafScenes.WizardContext<ConversationSessionData>) => {
    await context.reply('Enter the estimated weight (kg)');
};

export const sendDescriptionRegistrationMessage = async (context: TelegrafScenes.WizardContext<ConversationSessionData>) => {
    let descriptionMessage = 'Please provide a small description about your pet.';
    descriptionMessage += '\nDescribe details that can help people to recognize your pet, such as hair, eyes/hair color, barking style, hair patterns, etc.';

    await context.reply(descriptionMessage);
};

export const sendPictureRegistrationMessage = async (context: TelegrafScenes.WizardContext<ConversationSessionData>) => {
    let pictureMessage = 'Send us a picture of your pet.';
    pictureMessage += ' Please provide a picture that matches the previous description.';
    
    await context.reply(pictureMessage);
};

export const getUserPets = async (storage: Storage, userId: number, fields: (keyof PetData | '_id')[] | '*') => {
    let projection: Record<string, number> | undefined;
    
    if (fields !== '*') {
        projection = {};
        for (const field of fields) {
            projection[field] = 1;
        }
    }

    return await storage.findAndGetAllAsObject<PetDocument>(AppCollections.PETS, { 'owners.0': userId }, { projection });
};