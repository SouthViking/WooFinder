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
    sendPetSecondaryOwnersRegistrationMessage,
    sendPictureRegistrationMessage,
    sendSizeRegistrationMessage,
    sendSpeciesRegistrationMessage,
    sendWeightRegistrationMessage,
} from '../../utils';
import { ConversationSessionData, Full, KeyboardButtonData, PetData, PetDocument, Scenes } from '../../types';

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
            { text: 'Other names', data: 'other_names' },
            { text: 'Date of birth', data: 'birthdate' },
            { text: 'Species', data: 'species' },
            { text: 'Size', data: 'size', },
            { text: 'Weight', data: 'weight' },
            { text: 'Description', data: 'description' },
            { text: 'Picture', data: 'picture' },
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

        const property = (context.update as any).callback_query?.data as string;
        switch (property) {
            case 'name':
                await sendPetNameRegistrationMessage(context);
                break;
            case 'other_names':
                await sendPetSecondaryOwnersRegistrationMessage(context);
                break;
            case 'birthdate':
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
            case 'picture':
                await sendPictureRegistrationMessage(context);
                break;
            default:
                await context.reply('⚠️ Please select one of the available options.');
                return context.wizard.selectStep(2); 
        }

        return context.wizard.next();
    },
);