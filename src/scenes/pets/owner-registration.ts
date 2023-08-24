/* eslint-disable @typescript-eslint/no-explicit-any */
import { ObjectId } from 'mongodb';
import { Markup, Scenes } from 'telegraf';

import { storage } from '../../db';
import { ConversationSessionData, PetDocument, UserDocument } from '../../types';
import { ensureUserExists, getUserPetsListKeyboard, sendSceneLeaveText } from '../../utils';

// Definition of the dialog with the user to add secondary owners to a specific pet.
export const petOwnerRegistrationScene = new Scenes.WizardScene<Scenes.WizardContext<ConversationSessionData>>(
    'petOwnerRegistrationScene',
    // [Step 0] Entry point: The step begins whenever the user selects the option to add an owner from the pets menu.
    async (context) => {
        const userId = context.from?.id;
        if (!userId) {
            context.reply('⚠️ There has been an error. Please try again later!');
            return context.scene.leave();
        }

        const petsButtons = await getUserPetsListKeyboard(userId, storage);

        if (petsButtons.length === 0) {
            context.reply('⚠️ You don\'t have pets registered right now.');
            return context.scene.leave();
        }

        context.reply('🐾 Select one of your current pets 🐾', {
            ...Markup.inlineKeyboard(petsButtons),
        });

        return context.wizard.next();
    },
    // [Step 1] Pet selection: Step in which the selected pet is detected and verified.
    async (context) => {
        const userId = context.from?.id;
        const petId = (context.update as any).callback_query?.data as string | undefined;
        if (!petId) {
            const possibleMessage = (context.update as any).message.text as string | undefined; 
            if (possibleMessage && possibleMessage.toLowerCase() === 'exit') {
                sendSceneLeaveText(context);
                return context.scene.leave();
            }

            context.reply('⚠️ Please select one of the listed pets.');
            return context.wizard.selectStep(1);
        }

        const usersCollection = storage.getCollection<UserDocument>('users');
        const petsCollection = storage.getCollection<PetDocument>('pets');
        const petDoc = await petsCollection.findOne({ _id: new ObjectId(petId) });
        if (!petDoc) {
            context.reply('⚠️ The pet was removed. Operation cancelled.');
            return context.scene.leave();
        }

        context.scene.session.targetId = petId;
        context.scene.session.pet = petDoc;

        let secondaryOwnersMessage = 'These are the current secondary owners that have been linked:\n\n';

        for (const ownerId of petDoc.owners) {
            const userDoc = await usersCollection.findOne({ _id: ownerId });
            if (!userDoc) {
                // TODO: Fix the owners list in the pet document by removing the ones that no longer exist.
                continue;
            }
            if (userDoc._id === userId) {
                // Skip, since the current user document is the one of the main owner.
                continue;
            }

            secondaryOwnersMessage += `· <b>${userDoc.username}</b>\n`;
        }

        if (petDoc.owners.length <= 1) {
            secondaryOwnersMessage += 'ℹ️ There are no secondary owners linked to the current pet.\n';
        }

        secondaryOwnersMessage += '\nEnter the IDs of the users to be linked to the current pet separated by a space.';
        context.reply(secondaryOwnersMessage, { parse_mode: 'HTML' });

        return context.wizard.next();
    },
    // [Step 2] New owners definition: In this step the user has entered the text with the new owner IDs.
    // This step also verifies if the IDs can be stored and adds them to the list of owners for the pet that was specified.
    async (context) => {
        await ensureUserExists(context, storage);

        const newOwnerIds = (context.message as any).text as string | undefined;
        if (!newOwnerIds) {
            context.reply('⚠️ Please provide the IDs of new owners to be linked to the current pet.');
            return context.wizard.selectStep(2);
        }
        if (newOwnerIds.toLowerCase() === 'exit') {
            sendSceneLeaveText(context);
            return context.scene.leave();
        }

        const currentOwnersMap: Record<number, boolean> = {};
        for (const currentOwnerId of context.scene.session.pet?.owners ?? []) {
            currentOwnersMap[currentOwnerId] = true;
        }

        const ownerIdsToLink: number[] = [];
        const newOwnersList = newOwnerIds.split(' ');
        for (const newOwner of newOwnersList) {
            const newOwnerId = parseInt(newOwner);
            if (isNaN(newOwnerId)) {
                context.reply(`⚠️ Could not add secondary owner <b>"${newOwner}</b>", the value is not a valid ID.`, { parse_mode: 'HTML' });
                continue;
            }
            if (currentOwnersMap[newOwnerId]) {
                context.reply(`⚠️ Could not add secondary owner <b>"${newOwner}</b>",, the owner ID already exists.`, { parse_mode: 'HTML' });
                continue;
            }
            ownerIdsToLink.push(newOwnerId);
        }

        if (ownerIdsToLink.length === 0) {
            context.reply('⚠️ Operation cancelled. All provided owner IDs are invalid.');
            return context.scene.leave();
        }

        const petsCollection = storage.getCollection<PetDocument>('pets');
        const result = await petsCollection.updateOne({ _id: new ObjectId(context.scene.session.targetId) }, {
            $set: {
                owners: [...(context.scene.session.pet?.owners ?? []), ...ownerIdsToLink],
            },
        });

        if (result.acknowledged) {
            context.reply('✅ The secondary owners have been linked correctly!');
        } else {
            context.reply('⚠️ We could not link the owner IDs. Please try again later.');
        }

        return context.scene.leave();
    },
);