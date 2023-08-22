import { ObjectId } from 'mongodb';
import { Markup, Scenes } from 'telegraf';

import { storage } from '../../db';
import { ensureUserExists } from '../../utils/users';
import { sendSceneLeaveText } from '../../utils/scenes';
import { getUserPetsListKeyboard } from '../../utils/pets';
import { LostPetReportDocument } from '../../types/models';
import { ConversationSessionData, Coordinates } from '../../types/misc';

export const lostPetReportCreationScene = new Scenes.WizardScene<Scenes.WizardContext<ConversationSessionData>>(
    'lostPetReportCreationScene',
    async (context) => {
        const userId = context.from?.id;
        if (!userId) {
            context.reply('⚠️ There has been an error. Please try again later.');
            return context.scene.leave();
        }

        const petsKeyboard = await getUserPetsListKeyboard(userId, storage);
        if (petsKeyboard.length === 0) {
            context.reply('⚠️ You don\'t have pets registered right now. Use the <b>/pets</b> menu to register them.', {
                parse_mode: 'HTML',
            });
            return context.scene.leave();
        }

        context.reply('We are sorry that your pet is lost. To help you please select the lost one.', {
            ...Markup.inlineKeyboard(petsKeyboard),
        });

        return context.wizard.next();
    },
    async (context) => {
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

        const reportsCollection = storage.getCollection<LostPetReportDocument>('reports');
        if ((await reportsCollection.countDocuments({ petId: new ObjectId(petId), isActive: true }) !== 0)) {
            context.reply('⚠️ The selected pet already has an active report. You can update it by using the <b>/reports</b> command.', {
                parse_mode: 'HTML',
            });
            return context.scene.leave();
        }

        context.scene.session.targetId = petId;

        context.reply('Please send us the location (can be an estimation) where your pet got lost.');
        return context.wizard.next();
    },
    async (context) => {
        const lastSeenCoordinates = (context.update as any).message?.location as Coordinates | undefined;
        if (!lastSeenCoordinates) {
            const possibleMessage = (context.update as any).message?.text as string | undefined;
            if (possibleMessage && possibleMessage.toLowerCase() === 'exit') {
                sendSceneLeaveText(context);
                return context.scene.leave();
            }

            context.reply('⚠️ You must provide a valid location.');
            return context.wizard.selectStep(2);
        }

       await ensureUserExists(context, storage);

        const lostPetReportCollecion = storage.getCollection<LostPetReportDocument>('reports');
        const result = await lostPetReportCollecion.insertOne({
            petId: new ObjectId(context.scene.session.targetId),
            lastSeen: lastSeenCoordinates,
            createdAt: Date.now(),
            isActive: true,
        });

        if (result.acknowledged) {
            context.reply('✅ Your report has been generated correctly. Use <b>/reports</b> to manage them.', {
                parse_mode: 'HTML',
            });
            context.reply('🔎 You will get a notification in case someone finds your pet.');
        } else {
            context.reply('⚠️ We could not save the report. Please try again later.');
        }

        return context.scene.leave();
    },
);