/* eslint-disable @typescript-eslint/no-explicit-any */
import { ObjectId } from 'mongodb';
import { Markup, Scenes as TelegrafScenes } from 'telegraf';

import { AppCollections, storage } from '../../db';
import { 
    generatePetSummaryHTMLMessage,
    getUserPetsListKeyboard,
    generateTelegramKeyboardWithButtons,
    replyMatchesText,
    sendSceneLeaveText,
    sendBirthDateRegistrationMessage,
    sendDescriptionRegistrationMessage,
    sendPetNameRegistrationMessage,
    sendPetOtherNamesRegistrationMessage,
    sendPictureRegistrationMessage,
    sendSizeRegistrationMessage,
    sendSpeciesRegistrationMessage,
    sendWeightRegistrationMessage,
} from '../../utils';
import { ConversationSessionData, Full, KeyboardButtonData, PetData, PetDocument, Scenes } from '../../types';
import { ValidationResult, validateOtherPetNames, validatePetBirthDate, validatePetName, validatePetPictureId, validatePetSize, validatePetSpecies, validatePetWeight } from '../../validators/pets';

export const petUpdateScene = new TelegrafScenes.WizardScene<TelegrafScenes.WizardContext<ConversationSessionData>>(
    Scenes.PET_UPDATE,
    async (context) => {
        const userId = context.from?.id;
        if (!userId) {
            context.reply('⚠️ There has been an error. Please try again later.');
            return context.scene.leave();
        }

        const keyboard = await getUserPetsListKeyboard(userId, storage);

        if (keyboard.length === 0) {
            context.reply(`⚠️ You don't have pets registered right now. Use the /pets menu to register them.`);
            return context.scene.leave();
        }

        await context.reply('Select the pet that you want to update.', {
            ...Markup.inlineKeyboard(keyboard),
        });

        return context.wizard.next();
    },
    async (context) => {
        if (replyMatchesText(context, 'exit')) {
            sendSceneLeaveText(context);
            return context.scene.leave();
        }
        if (context.updateType !== 'callback_query') {
            await context.reply('⚠️ The selected option is not valid. Please select one of the available options.');
            return context.wizard.selectStep(1);
        }

        const targetPetId = (context.update as any).callback_query.data as string;

        const petDoc = await storage.findOne<PetDocument>(AppCollections.PETS, { _id: new ObjectId(targetPetId)  });
        if (!petDoc) {
            await context.reply('⚠️ The pet was not found. Please try again later.');
            return context.scene.leave();
        }

        context.scene.session.targetId = targetPetId;
        context.scene.session.pet = petDoc;

        const keyboardOptions: KeyboardButtonData[] = [
            { text: 'Name', data: 'name' },
            { text: 'Other names', data: 'otherNames' },
            { text: 'Date of birth', data: 'birthDate' },
            { text: 'Species', data: 'species' },
            { text: 'Size', data: 'size', },
            { text: 'Weight', data: 'weight' },
            { text: 'Description', data: 'description' },
            { text: 'Picture', data: 'pictureRemoteId' },
        ];
        
        await context.reply(generatePetSummaryHTMLMessage(context.scene.session.pet as Full<PetData>), { parse_mode: 'HTML' });
        await context.reply('What would you like to update?', { 
            ...Markup.inlineKeyboard(generateTelegramKeyboardWithButtons(keyboardOptions, 2)),
         });

         return context.wizard.next();
    },
    async (context) => {
        if (replyMatchesText(context, 'exit')) {
            sendSceneLeaveText(context);
            return context.scene.leave();
        }
        if (context.updateType !== 'callback_query') {
            await context.reply('⚠️ Please select one of the available options.');
            return context.wizard.selectStep(2);
        }

        const field = (context.update as any).callback_query?.data as string;
        switch (field) {
            case 'name':
                await sendPetNameRegistrationMessage(context);
                break;
            case 'otherNames':
                await sendPetOtherNamesRegistrationMessage(context);
                break;
            case 'birthDate':
                await sendBirthDateRegistrationMessage(context);
                break;
            case 'species':
                await sendSpeciesRegistrationMessage(context);
                break;
            case 'size':
                await sendSizeRegistrationMessage(context);
                break;
            case 'weight':
                await sendWeightRegistrationMessage(context);
                break;
            case 'description':
                await sendDescriptionRegistrationMessage(context);
                break;
            case 'pictureRemoteId':
                await sendPictureRegistrationMessage(context);
                break;
            default:
                await context.reply('⚠️ Please select one of the available options.');
                return context.wizard.selectStep(2); 
        }

        context.scene.session.userInput = { fieldToUpdate: field };

        return context.wizard.next();
    },
    async (context) => {
        if (!context.scene.session.targetId) {
            context.reply('⚠️ There has been an issue with the current flow. Restarting process.');
            return context.scene.reenter();
        }

        const fieldToUpdate = context.scene.session.userInput!.fieldToUpdate as string;

        const newValue = (context.update as any).message?.photo?.[0].file_id ||
            (context.update as any).callback_query?.data ||
            (context.update as any).document?.file_id ||
            ((context.message as any)?.text) as string | undefined;
        if (!newValue) {
            context.reply('⚠️ The input is not valid. Please try again.');
            return context.wizard.selectStep(3);
        }

        let validationInfo: ValidationResult<any> = { isValid: true, validatedValue: newValue };
        switch (fieldToUpdate) {
            case 'name':
                validationInfo = validatePetName(newValue);
                break;
            case 'birthDate':
                validationInfo = validatePetBirthDate(newValue);
                break;
            case 'species':
                validationInfo = await validatePetSpecies(newValue);
                break;
            case 'size':
                validationInfo = validatePetSize(newValue);
                break;
            case 'weight':
                validationInfo = validatePetWeight(newValue);
                break;
            case 'otherNames':
                validationInfo = validateOtherPetNames(newValue);
                break;
            case 'pictureRemoteId': 
                validationInfo = await validatePetPictureId(context, newValue);
                break;
        }

        if (!validationInfo.isValid) {
            context.reply(`⚠️ The input is not valid (${validationInfo.errorMessage}). Please try again.`);
            return context.wizard.selectStep(3);
        }

        const petsCollection = storage.getCollection<PetDocument>(AppCollections.PETS);
        await petsCollection.updateOne({ _id: new ObjectId(context.scene.session.targetId) }, {
            $set: {
                [fieldToUpdate]: validationInfo.validatedValue,
                updatedAt: Date.now(),
            },
        });

        context.reply('✅ The pet has been updated correctly!');
        return context.scene.leave();
    },
);