/* eslint-disable @typescript-eslint/no-explicit-any */
import { ObjectId } from 'mongodb';
import { Scenes as TelegrafScenes } from 'telegraf';

import { AppCollections, storage } from '../../db';
import { ConversationSessionData, Full, PetData, PetDocument, Scenes } from '../../types';
import {
    MAX_SECONDARY_PET_NAMES_ALLOWED,
    ensureUserExists,
    generatePetSummaryHTMLMessage,
    isValidBirthDate,
    replyMatchesText,
    sendBirthDateRegistrationMessage,
    sendDescriptionRegistrationMessage,
    sendPetNameRegistrationMessage,
    sendPetSecondaryOwnersRegistrationMessage,
    sendPictureRegistrationMessage,
    sendSceneLeaveText,
    sendSizeRegistrationMessage,
    sendSpeciesRegistrationMessage,
    sendWeightRegistrationMessage,
} from '../../utils';

// Definition of the scene with the steps that will be executed whenever a user starts a new pet creation.
export const petRegistrationScene = new TelegrafScenes.WizardScene<TelegrafScenes.WizardContext<ConversationSessionData>>(
    Scenes.PET_REGISTRATION,
    // [Step 0] Entry point: The step beings whenever the user selects the option to add a new pet from the pets menu.
    async (context) => {
        context.scene.session.pet = {};
        context.scene.session.pet.owners = [context.from!.id];

        await sendSpeciesRegistrationMessage(context);

        return context.wizard.next();
    },
    // [Step 1] Species selection: In this step the user has to provide one of the available species for the target pet.
    async (context) => {
        if (replyMatchesText(context, 'exit')) {
            sendSceneLeaveText(context);
            return context.scene.leave();
        }
        if (context.updateType !== 'callback_query') {
            context.reply('⚠️ You must choose one of the available options. Please select again.');
            return context.wizard.selectStep(1);
        }

        const speciesId = (context.update as any).callback_query?.data as string;

        context.scene.session.pet!.species = new ObjectId(speciesId);

        await sendPetNameRegistrationMessage(context);

        return context.wizard.next();
    },
    // [Step 2] Name: In this step the user has to provide the name of the pet.
    async (context) => {
        if (replyMatchesText(context, 'exit')) {
            sendSceneLeaveText(context);
            return context.scene.leave();
        }
        if (replyMatchesText(context, 'back')) {
            return context.wizard.back();
        }
        if (context.updateType !== 'message') {
            context.reply('⚠️ You need to specify a name for your pet. Please send again.');
            return context.wizard.selectStep(2);
        }

        const answer = (context.message as any).text as string;

        context.scene.session.pet!.name = answer;

        await sendPetSecondaryOwnersRegistrationMessage(context);

        return context.wizard.next();
    },
    // [Step 3] Other names: In this step (which is also optional) the user can provide some other names for the pet.
    async (context) => {
        if (replyMatchesText(context, 'exit')) {
            sendSceneLeaveText(context);
            return context.scene.leave();
        }
        if (replyMatchesText(context, 'back')) {
            return context.wizard.back();
        }
        if (context.updateType !== 'message') {
            context.reply('⚠️ Incorrect input. Please send again.');
            return context.wizard.selectStep(3);
        }

        const answer = (context.message as any).text as string;

        if (answer.toLowerCase() !== 'no') {
            context.scene.session.pet!.otherNames = answer.split(' ').slice(0, MAX_SECONDARY_PET_NAMES_ALLOWED);
        }

        await sendBirthDateRegistrationMessage(context);

        return context.wizard.next();
    },
    // [Step 4] Birthdate: In this step the user has to provide a date of birth that have to be within a valid range.
    async (context) => {
        if (replyMatchesText(context, 'exit')) {
            sendSceneLeaveText(context);
            return context.scene.leave();
        }
        if (replyMatchesText(context, 'back')) {
            return context.wizard.back();
        }
        if (context.updateType !== 'message') {
            context.reply('⚠️ You need to specify a birthdate for your pet. Please send again.');
            return context.wizard.selectStep(2);
        }

        const answer = (context.message as any).text as string;

        const parsedBirthDate = Date.parse(answer);
        if (isNaN(parsedBirthDate)) {
            context.reply('⚠️ That is not a valid date. Please try again (format: <b>yyyy-mm-dd</b>)', { parse_mode: 'HTML' });
            return context.wizard.selectStep(4);
        }
        const { isValid, errorMessage } = isValidBirthDate(parsedBirthDate);
        if (!isValid) {
            context.reply(`⚠️ ${errorMessage}`);
            return context.wizard.selectStep(4);
        }

        context.scene.session.pet!.birthDate = parsedBirthDate;

        await sendSizeRegistrationMessage(context);

        return context.wizard.next();
    },
    // [Step 5] Size selection: The user has to enter one of the available options listed in the menu above.
    async (context) => {
        if (context.updateType !== 'callback_query') {
            context.reply('⚠️ You must choose one of the available options. Please select again.');
            return context.wizard.selectStep(5);
        }

        const petSize = (context.update as any).callback_query?.data as string;

        context.scene.session.pet!.size = petSize

        await sendWeightRegistrationMessage(context);

        return context.wizard.next();
    },
    // [Step 6] Weight: In this step the user has to provide the pet's weight.
    async (context) => {
        if (replyMatchesText(context, 'exit')) {
            sendSceneLeaveText(context);
            return context.scene.leave();
        }
        if (replyMatchesText(context, 'back')) {
            return context.wizard.back();
        }
        if (context.updateType !== 'message') {
            context.reply('⚠️ You need to specify a estimated weight for your pet. Please send again.');
            return context.wizard.selectStep(6);
        }

        const answer = (context.message as any).text as string;

        const parsedWeight = parseFloat(answer);
        if (isNaN(parsedWeight) || parsedWeight <= 0) {
            context.reply('⚠️ The weight must be a positive number. Please try again. ');
            return context.wizard.selectStep(6);
        }

        context.scene.session.pet!.weight = parsedWeight;

        await sendDescriptionRegistrationMessage(context);

        return context.wizard.next();
    },
    // [Step 7] Description: In this step the user has to provide a description for the pet.
    async (context) => {
        if (replyMatchesText(context, 'exit')) {
            sendSceneLeaveText(context);
            return context.scene.leave();
        }
        if (replyMatchesText(context, 'back')) {
            return context.wizard.back();
        }
        if (context.updateType !== 'message') {
            context.reply('⚠️ You need to specify a description for your pet. Please send again.');
            return context.wizard.selectStep(7);
        }

        const answer = (context.message as any).text as string;

        context.scene.session.pet!.description = answer;

        await sendPictureRegistrationMessage(context);

        return context.wizard.next();

    },
    // [Step 8] Picture: This is the last step. The user must provide a picture of the pet. The picture is uploaded to Telegram and a new pet record is created.
    async (context) => {
        if (!(context.message as any).document && !(context.message as any).photo) {
            context.reply('⚠️ You need to send a valid picture (cannot be a compressed one). Please send again.');
            return context.wizard.selectStep(8);
        }

        // File ID represents the ID of the picture file that is stored in Telegram, which is accessible via an API.
        context.scene.session.pet!.pictureRemoteId = (context.message as any).document?.file_id || (context.message as any).photo?.[0].file_id;

        const petData = context.scene.session.pet!;

        let summaryMessage = generatePetSummaryHTMLMessage(petData as Full<PetData>);
        summaryMessage += 'Please review the information and send <b>"yes"</b> to confirm';
        
        context.reply(summaryMessage, { parse_mode: 'HTML' });

        return context.wizard.next();
    },
    async (context) => {
        const answer = (context.message as any).text as string | undefined;
        if (!answer || answer.toLowerCase() !== 'yes') {
            sendSceneLeaveText(context);
            return context.scene.leave();
        }

        // Make sure the user exists in the database, so the relation with the new pet is consistent.
        await ensureUserExists(context, storage);

        const petCollection = storage.getCollection<PetDocument>(AppCollections.PETS);
        
        const petData = context.scene.session.pet as Full<PetData>;
        const result = await petCollection.insertOne({
            owners: petData.owners,
            name: petData.name,
            otherNames: petData.otherNames,
            birthDate: petData.birthDate,
            species: petData.species,
            size: petData.size,
            weight: petData.weight,
            description: petData.description,
            // Storing the remote File ID, so it can be fetched from the Telegram API when needed.
            pictureRemoteId: context.scene.session.pet!.pictureRemoteId ?? '',
            createdAt: Date.now(),
        });

        if (result.acknowledged) {
            context.reply('✅ Your pet has been saved correctly!');
        } else {
            context.reply('⚠️ We could not save your pet. Please try again later.');
        }

        return context.scene.leave();
    },
);