/* eslint-disable @typescript-eslint/no-explicit-any */
import { ObjectId } from 'mongodb';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en.json';
import { Markup, Scenes as TelegrafScenes } from 'telegraf';

import { AppCollections, storage } from '../../db';
import { ConversationSessionData, Coordinates, KeyboardButtonData, LostPetReportDocument, Scenes, SpeciesDocument } from '../../types';
import { generateTelegramKeyboardWithButtons, getPetEmojiForSpeciesName, getUserPets, replyMatchesText, sendSceneLeaveText } from '../../utils';

TimeAgo.addDefaultLocale(en)
const timeAgo = new TimeAgo('en-US');

export const seeMyLostPetReportsScene = new TelegrafScenes.WizardScene<TelegrafScenes.WizardContext<ConversationSessionData>>(
    Scenes.DISPLAY_MY_LOST_REPORTS,
    async (context) => {
        const userId = context.from?.id;
        if (!userId) {
            await context.reply('⚠️ There has been an error. Please try again later.');
            return context.scene.leave();
        }

        const userPets = await getUserPets(storage, userId, ['_id', 'name', 'species']);
        const species = await storage.findAndGetAllAsObject<SpeciesDocument>(AppCollections.SPECIES, {});
        const userLostPetReports = await storage.findAndGetAll<LostPetReportDocument>(AppCollections.REPORTS, {
            petId: {
                $in: Object.keys(userPets).map(petId => (new ObjectId(petId))),
            },
        });

        if (userLostPetReports.length === 0) {
            await context.reply('⚠️ You don\'t have reports created. You can create them from the <b>/reports</b> menu.', {
                parse_mode: 'HTML',
            });
            return context.scene.leave();
        }

        const buttons: KeyboardButtonData[] = [];
        for (const reportDoc of userLostPetReports) {
            const petData = userPets[reportDoc.petId.toString()];
            const petEmoji = getPetEmojiForSpeciesName(species[petData.species.toString()]?.name ?? '');

            buttons.push({ text: `${petEmoji} ${petData.name} (${timeAgo.format(reportDoc.createdAt)})`, data:  `${reportDoc._id.toString()}_${petData.name}` });
        }

        await context.reply('🔎🐾 Please select one of your current reports.', {
            ...Markup.inlineKeyboard(generateTelegramKeyboardWithButtons(buttons, 2)),
        });

        return context.wizard.next();
    },
    async (context) => {
        if (replyMatchesText(context, 'exit')) {
            sendSceneLeaveText(context);
            return context.scene.leave();
        }
        if (context.updateType !== 'callback_query') {
            await context.reply('⚠️ Please select one of the listed reports. (Enter <b>exit</b> to leave)', { parse_mode: 'HTML' });
            return context.wizard.selectStep(1);
        }

        const [reportId, petName] = ((context.update as any).callback_query?.data as string).split('_');

        const reportDoc = await storage.findOne<LostPetReportDocument>(AppCollections.REPORTS, { _id: new ObjectId(reportId) });
        if (!reportDoc) {
            await context.reply('⚠️ There has been an error with the selected report. Could not be found. Please select again.');
            return context.wizard.selectStep(1);
        }

        context.scene.session.targetId = reportDoc._id.toString();

        let reportSummaryMessage = `🔎🐾 Lost Report summary of <b>${petName}</b>\n\n`;
        reportSummaryMessage += `📅 <b>Created at</b>: ${new Date(reportDoc.createdAt)} (${timeAgo.format(reportDoc.createdAt)})\n`;
        reportSummaryMessage += `📍 <b>Location specified</b>:`;
        
        await context.reply(reportSummaryMessage, { parse_mode: 'HTML' });
        await context.replyWithLocation(reportDoc.lastSeen.coordinates[1], reportDoc.lastSeen.coordinates[0], {
        
        });

        await context.reply('Select one of the available options', {
            ...Markup.inlineKeyboard([
                [
                    Markup.button.callback('Delete report', 'delete_report'),
                    Markup.button.callback('Update coordinates', 'update_coords'),
                ]
            ]),
        })

        return context.wizard.next();
    },
    async (context) => {
        if (replyMatchesText(context, 'exit')) {
            sendSceneLeaveText(context);
            return context.scene.leave();
        }
        if (context.updateType !== 'callback_query') {
            await context.reply('⚠️ Please select one of the listed options. (Enter <b>exit</b> to leave)', { parse_mode: 'HTML' });
            return context.wizard.selectStep(2);
        }

        const option = (context.update as any).callback_query?.data as string; 

        switch (option) {
            case 'delete_report': {
                const reportsCollection = storage.getCollection<LostPetReportDocument>(AppCollections.REPORTS);
                await reportsCollection.deleteMany({ _id: new ObjectId(context.scene.session.targetId) });

                await context.reply('✔️ The report has been removed correctly.');

                return context.scene.leave();   
            }

            case 'update_coords':
                await context.reply('📍 Please enter the new location to update the report.');
                break;
            default:
                await context.reply('⚠️ The selected option is not correct.');
                return context.scene.leave();
        }

        return context.wizard.next();
    },
    async (context) => {
        if (replyMatchesText(context, 'exit')) {
            sendSceneLeaveText(context);
            return context.scene.leave();
        }
        if (context.updateType !== 'message') {
            context.reply('⚠️ You must provide a valid location.');
            return context.wizard.selectStep(3);
        }

        const lastSeenCoordinates = (context.update as any).message?.location as Coordinates | undefined;
        if (!lastSeenCoordinates) {
            context.reply('⚠️ You must provide a valid location.');
            return context.wizard.selectStep(3);
        }

        const reportsCollection = storage.getCollection<LostPetReportDocument>(AppCollections.REPORTS);
        await reportsCollection.updateOne({
            _id: new ObjectId(context.scene.session.targetId),
        }, { $set: { 'lastSeen.coordinates': [lastSeenCoordinates.longitude, lastSeenCoordinates.latitude], } });
    
        await context.reply('✔️ The location has been updated correctly.');
        
        return context.scene.leave();
    },
);