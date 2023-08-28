/* eslint-disable @typescript-eslint/no-explicit-any */
import { ObjectId } from 'mongodb';
import { Markup, Scenes as TelegrafScenes } from 'telegraf';

import { AppCollections, storage } from '../../db';
import { getUserPetsListKeyboard, replyMatchesText, sendSceneLeaveText } from '../../utils';
import { ConversationSessionData, LostPetReportDocument, PetDocument, Scenes } from '../../types';

export const petRemoveScene = new TelegrafScenes.WizardScene<TelegrafScenes.WizardContext<ConversationSessionData>>(
    Scenes.PET_REMOVE,
    // [Step 0] Entry point: The step begins whenever the user selects the option to delete a pet.
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

        await context.reply('Select the pet that you want to remove.', {
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
        context.scene.session.pet = { name: petDoc.name };

        let confirmationMessage = '⚠️ All the reports and pet data will be erased. <b>This operation is not reversible.</b>\n';
        confirmationMessage += `To confirm, please enter the name of the pet to be deleted: <b>${context.scene.session.pet!.name}</b>`

        await context.reply(confirmationMessage, { parse_mode: 'HTML' });

        return context.wizard.next();
    },
    async (context) => {
        const text = (context.message as any).text as string | undefined;
        if (!text || text !== context.scene.session.pet!.name) {
            sendSceneLeaveText(context);
            return context.scene.leave();
        }

        const petId = new ObjectId(context.scene.session.targetId!);

        const petsCollection = storage.getCollection<PetDocument>(AppCollections.PETS);
        const reportsCollection = storage.getCollection<LostPetReportDocument>(AppCollections.REPORTS);

        // TODO: Run this type of processes within a transaction to ensure they are atomic.
        await reportsCollection.deleteMany({ petId });
        await petsCollection.deleteOne({ _id: petId });

        // TODO: Notify other owners about the deletion of the pet record.

        await context.reply('✔️ The pet and the reports have been removed correctly.');

        return context.scene.leave();
    },
);