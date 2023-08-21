import { ObjectId } from 'mongodb';
import { Markup, Scenes } from 'telegraf';
import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';

import { storage } from '../../db';
import { sendSceneLeaveText } from '../../utils/scenes';
import { ConversationSessionData, Full } from '../../types/misc';
import { PetData, PetDocument, SpeciesDocument } from '../../types/models';
import { getPetEmojiForSpeciesName, isValidBirthDate } from '../../utils/pets';

const MAX_SECONDARY_PET_NAMES_ALLOWED = 5;
export const PET_REGISTRATION_SCENE_ID = 'petRegistrationScene';

// Definition of the scene with the steps that will be executed whenever a user starts a new pet creation.
export const petRegistrationScene = new Scenes.WizardScene<Scenes.WizardContext<ConversationSessionData>>(
    PET_REGISTRATION_SCENE_ID,
    async (context) => {
        context.scene.session.pet = {};
        context.scene.session.pet.owners = [context.from!.id];

        const speciesCollection = storage.getCollection<SpeciesDocument>('species');
        if ((await speciesCollection.estimatedDocumentCount()) === 0) {
            context.reply('⚠️ There are no species available right now for pet registration. Please try again later!');
            sendSceneLeaveText(context);
            return context.scene.leave();
        }

        // Keyboard generation with the species fetched from DB
        const keyboard: InlineKeyboardButton.CallbackButton[][] = [];

        let line: InlineKeyboardButton.CallbackButton[] = [];
        for await (const speciesDoc of speciesCollection.find()) {
            const petEmoji = getPetEmojiForSpeciesName(speciesDoc.name);

            line.push(Markup.button.callback(`${petEmoji ? `${petEmoji} ` : ''}${speciesDoc.name}`, `${speciesDoc._id}`));
            if (line.length >= 2) {
                keyboard.push(line);
                line = [];
            }
        }

        if (line.length) {
            keyboard.push(line);
        }

        context.reply(
            'Okay! Lets add a new pet to your list! (Enter <b>"exit"</b> to cancel / <b>"back"</b> to go to previous steps)',
            {
                parse_mode: 'HTML',
            }
        );
        context.reply('What kind of pet would you like to register?', { ...Markup.inlineKeyboard(keyboard) });

        return context.wizard.next();
    },
    async (context) => {
        const speciesId = (context.update as any).callback_query?.data as string | undefined;
        if (!speciesId) {
            const possibleMessage = (context.update as any).message.text as string | undefined; 
            if (possibleMessage && possibleMessage.toLowerCase() === 'exit') {
                sendSceneLeaveText(context);
                return context.scene.leave();
            }

            context.reply('⚠️ You must choose one of the available options. Please select again.');
            return context.wizard.selectStep(1);
        }

        context.scene.session.pet!.species = new ObjectId(speciesId);

        context.reply(
            'Now enter the name of your pet: ',
            { parse_mode: 'HTML' },    
        );

        return context.wizard.next();
    },
    async (context) => {
        const answer = (context.message as any).text as string | undefined;
        if (!answer) {
            context.reply('⚠️ You need to specify a name for your pet. Please send again.');
            return context.wizard.selectStep(2);
        }
        if (answer.toLowerCase() === 'exit') {
            sendSceneLeaveText(context);
            return context.scene.leave();
        }
        if (answer.toLowerCase() === 'back') {
            sendSceneLeaveText(context);
            return context.wizard.back();
        }

        context.scene.session.pet!.name = answer;

        let instructionsMessage = 'Sometimes pets have more than one name that they can recognize. ';
        instructionsMessage += `Please enter a list of secondary names separated by a space (max ${MAX_SECONDARY_PET_NAMES_ALLOWED}), send <b>"no"</b> otherwise.`;

        context.reply(instructionsMessage, { parse_mode: 'HTML' });

        return context.wizard.next();
    },
    async (context) => {
        const answer = (context.message as any).text as string | undefined;
        if (!answer) {
            context.reply('⚠️ Incorrect input. Please send again.');
            return context.wizard.selectStep(3);
        }
        if (answer.toLowerCase() === 'exit') {
            sendSceneLeaveText(context);
            return context.scene.leave();
        }
        if (answer.toLowerCase() === 'back') {
            return context.wizard.back();
        }

        if (answer.toLowerCase() !== 'no') {
            context.scene.session.pet!.otherNames = answer.split(' ').slice(0, MAX_SECONDARY_PET_NAMES_ALLOWED);
        }

        context.reply('Enter pet\'s birthdate (format: <b>yyyy-mm-dd</b>)', { parse_mode: 'HTML' });

        return context.wizard.next();
    },
    async (context) => {
        const answer = (context.message as any).text as string | undefined;
        if (!answer) {
            context.reply('⚠️ You need to specify a birthdate for your pet. Please send again.');
            return context.wizard.selectStep(2);
        }
        if (answer.toLowerCase() === 'exit') {
            sendSceneLeaveText(context);
            return context.scene.leave();
        }
        if (answer.toLowerCase() === 'back') {
            return context.wizard.back();
        }

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

        context.reply('Please select the estimated size of your pet', { 
            ...Markup.inlineKeyboard([
                [Markup.button.callback('small', 'small'), Markup.button.callback('medium', 'medium')],
                [Markup.button.callback('large', 'large'), Markup.button.callback('giant', 'giant')]
            ]) ,
        });

        return context.wizard.next();
    },
    async (context) => {
        const petSize = (context.update as any).callback_query?.data as string | undefined;
        if (!petSize) {
            context.reply('⚠️ You must choose one of the available options. Please select again.');
            return context.wizard.selectStep(5);
        }

        context.scene.session.pet!.size = petSize

        context.reply('Now enter the estimated weight (kg)');

        return context.wizard.next();
    },
    async (context) => {
        const answer = (context.message as any).text as string | undefined;
        if (!answer) {
            context.reply('⚠️ You need to specify a estimated weight for your pet. Please send again.');
            return context.wizard.selectStep(6);
        }
        if (answer.toLowerCase() === 'exit') {
            sendSceneLeaveText(context);
            return context.scene.leave();
        }
        if (answer.toLowerCase() === 'back') {
            return context.wizard.back();
        }

        const parsedWeight = parseFloat(answer);
        if (isNaN(parsedWeight) || parsedWeight <= 0) {
            context.reply('⚠️ The weight must be a positive number. Please try again. ');
            return context.wizard.selectStep(6);
        }

        context.scene.session.pet!.weight = parsedWeight;

        let descriptionMessage = 'We are almost done! Please provide a small description about your pet.';
        descriptionMessage += '\nDescribe details that can help people to recognize your pet, such as hair, eyes/hair color, barking style, hair patterns, etc.';

        context.reply(descriptionMessage);

        return context.wizard.next();
    },
    async (context) => {
        const answer = (context.message as any).text as string;
        if (!answer) {
            context.reply('⚠️ You need to specify a description for your pet. Please send again.');
            return context.wizard.selectStep(7);
        }
        if (answer.toLowerCase() === 'exit') {
            sendSceneLeaveText(context);
            return context.scene.leave();
        }
        if (answer.toLowerCase() === 'back') {
            return context.wizard.back();
        }

        context.scene.session.pet!.description = answer;

        let pictureMessage = 'Last but not least! Send us a picture of your pet.';
        pictureMessage += ' Please provide a picture that matches the previous description.';
        
        context.reply(pictureMessage);

        return context.wizard.next();

    },
    async (context) => {
        if (!(context.message as any).document && !(context.message as any).photo) {
            context.reply('⚠️ You need to send a valid picture (cannot be a compressed one). Please send again.');
            return context.wizard.selectStep(8);
        }

        context.scene.session.pet!.pictureRemoteId = (context.message as any).document?.file_id || (context.message as any).photo?.[0].file_id;

        const petData = context.scene.session.pet!;

        let summaryMessage = `🐾 <b>${petData.name}'s record</b> 🐾\n`;
        summaryMessage += `⚫ <b>Secondary names</b>: ${petData.otherNames}\n`;
        summaryMessage += `⚫ <b>Date of birth</b>: ${petData.birthDate}\n`;
        summaryMessage += `⚫ <b>Size</b>: ${petData.size}\n`;
        summaryMessage += `⚫ <b>Weight</b>: ${petData.weight} kg\n`;
        summaryMessage += `⚫ <b>Description</b>: ${petData.description}\n`;
        
        context.reply(summaryMessage, { parse_mode: 'HTML' });
        context.reply('Please review the information and send <b>"yes"</b> to confirm.', { parse_mode: 'HTML' });

        return context.wizard.next();
    },
    async (context) => {
        const answer = (context.message as any).text as string | undefined;
        if (!answer || answer.toLowerCase() !== 'yes') {
            sendSceneLeaveText(context);
            return context.scene.leave();
        }

        const petCollection = storage.getCollection<PetDocument>('pets');
        
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
            pictureRemoteId: context.scene.session.pet!.pictureRemoteId ?? '',
        });

        if (result.acknowledged) {
            context.reply('✅ Your pet has been saved correctly!');
        } else {
            context.reply('⚠️ We could not save your pet. Please try again later.');
        }

        return context.scene.leave();
    },
)