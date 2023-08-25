/* eslint-disable @typescript-eslint/no-explicit-any */
import { ObjectId } from 'mongodb';
import TimeAgo from 'javascript-time-ago';
import { Markup, Scenes } from 'telegraf';
import en from 'javascript-time-ago/locale/en'
import { Contact } from 'telegraf/typings/core/types/typegram';

import { storage } from '../../db';
import { getLostPetsKeyboard } from '../../utils/reports';
import { generatePetSummaryHTMLMessage, sendSceneLeaveText } from '../../utils';
import { ConversationSessionData, Coordinates, LostPetReportDocument, PetDocument } from '../../types';

const MAX_SEARCH_RADIUS_KM = 0.5;

TimeAgo.addDefaultLocale(en)
const timeAgo = new TimeAgo('en-US');

// Definition of the dialog with the user to see another's lost pet reports.
export const seeOthersLostPetReportsScene = new Scenes.WizardScene<Scenes.WizardContext<ConversationSessionData>>(
    'seeOthersLostPetReportsScene',
    // [Step 0] Entry point: The step begins whenever the user selects the option to see another's reports from the reports menu.
    async (context) => {
        context.reply('🔎🐾 Send a location to see the list of reports near to it.');
        return context.wizard.next();
    },
    // [Step 1] Location: The user must provide a location. It can their own location or any other place of interest.
    async (context) => {
        const userId = context.from?.id;
        if (!userId) {
            context.reply('⚠️ There has been an error. Please try again later!');
            return context.scene.leave();
        }

        // Coordinates sent by the user to generate the search.
        const coordinates = (context.update as any).message?.location as Coordinates | undefined;
        if (!coordinates) {
            const possibleMessage = (context.update as any).message?.text as string | undefined;
            if (possibleMessage && possibleMessage.toLowerCase() === 'exit') {
                sendSceneLeaveText(context);
                return context.scene.leave();
            }
            
            context.reply('⚠️ You must provide a valid location.');
            return context.wizard.selectStep(1);
        }

        const lostPetsKeyboard = await getLostPetsKeyboard(storage, userId, {
            coordinates,
            radiusKm: MAX_SEARCH_RADIUS_KM, // TODO: Make radius custom for users as part of the settings
        });

        if (lostPetsKeyboard.length === 0) {
            context.reply('🔎❌ There are no active reports of lost pets near to the provided location.');
            return context.scene.leave();
        }

        let foundResultsMessage = '🔎🐾 We have found some results! This is the list of lost pets that are near to the provided location.\n';
        foundResultsMessage += 'Select one to see more detail.';

        context.reply(foundResultsMessage, {
            ...Markup.inlineKeyboard(lostPetsKeyboard),
        });

        return context.wizard.next();
    },
    // [Step 2] Pet selection: The user must select one of the available pets regarding the previous search.
    async (context) => {
        const petId = (context.update as any).callback_query?.data as string | undefined;
        if (!petId) {
            const possibleMessage = (context.update as any).message.text as string | undefined; 
            if (possibleMessage && possibleMessage.toLowerCase() === 'exit') {
                sendSceneLeaveText(context);
                return context.scene.leave();
            }

            context.reply('⚠️ Please select one of the listed pets.');
            return context.wizard.selectStep(2);
        }
        
        const petsCollection = storage.getCollection<PetDocument>('pets');
        const petDoc = await petsCollection.findOne({ _id: new ObjectId(petId) });
        if (!petDoc) {
            context.reply('⚠️ The pet was not found. Please try again.');
            sendSceneLeaveText(context);
            return context.scene.leave();
        }

        context.scene.session.pet = petDoc;

        const reportsCollection = storage.getCollection<LostPetReportDocument>('reports');
        const activeReport = await reportsCollection.findOne({ petId: new ObjectId(petId), isActive: true }); 
        if (!activeReport) {
            context.reply('⚠️ The lost report of the pet was not found. Please try again.');
            sendSceneLeaveText(context);
            return context.scene.leave();
        }

        let basePetSummary = generatePetSummaryHTMLMessage(petDoc);
        const createdAtDate = new Date(activeReport.createdAt);

        basePetSummary += `· <b>Report created at</b>: ${createdAtDate} (${timeAgo.format(createdAtDate)})`
        
        if (activeReport.updatedAt) {
            const updatedAtDate = new Date(activeReport.updatedAt);
            basePetSummary += `· <b>Report updated at</b>: ${updatedAtDate} (${timeAgo.format(updatedAtDate)})`
        }


        await context.reply(basePetSummary, { parse_mode: 'HTML' });

        await context.reply('🗺️ This is the location where it was originally reported as lost.');
        await context.replyWithLocation(activeReport.lastSeen.coordinates[1], activeReport.lastSeen.coordinates[0]);

        await context.reply('📷 And a reference picture.');
        await context.replyWithPhoto(petDoc.pictureRemoteId);

        context.reply('Have you seen it? Let the owner know!', {
            ...Markup.inlineKeyboard([
                [
                    Markup.button.callback('Yes, I have seen it', 'seen_it'),
                    Markup.button.callback('Yes, I found it', 'found_it'),
                ],
                [ 
                    Markup.button.callback('Back', 'back'),
                    Markup.button.callback('Exit', 'exit'),
                ],
            ]),
        });

        return context.wizard.next();
    },
    // [Step 3] Report option selection: The user has to select whether they want to notify the owner or exit.
    async (context) => {
        const selectedOption = (context.update as any).callback_query?.data as string | undefined;
        if (!selectedOption) {
            const possibleMessage = (context.update as any).message.text as string | undefined; 
            if (possibleMessage && possibleMessage.toLowerCase() === 'exit') {
                sendSceneLeaveText(context);
                return context.scene.leave();
            }

            context.reply('⚠️ Please select one of the listed options.');
            return context.wizard.selectStep(3);
        }

        if (selectedOption === 'exit') {
            sendSceneLeaveText(context);
            return context.scene.leave();
        }

        context.scene.session.targetId = selectedOption;

        await context.reply('Please send your contact to reach out to the owners.', {
            reply_markup: {
                keyboard: [
                    [
                        {
                            text: "📞 Send your phone number",
                            request_contact: true,
                        },
                    ]
                ],
                one_time_keyboard: true,
            }
        });

        return context.wizard.next();
    },
    // [Step 4] Contact information: The user has to provide their own contact information, so the bot can notify the owners with this info.
    async (context) => {
        const contact = (context.update as any).message.contact as Contact | undefined;
        if (!contact) {
            const possibleMessage = (context.update as any).message.text as string | undefined; 
            if (possibleMessage && possibleMessage.toLowerCase() === 'exit') {
                sendSceneLeaveText(context);
                return context.scene.leave();
            }

            context.reply('⚠️ Please provide your contact information.');
            return context.wizard.selectStep(4);
        }

        const petName = context.scene.session.pet?.name ?? '';
        const selectedVerb = context.scene.session.targetId!.split('_')[0]!;

        let notificationMessage = `🔔🐾 <b>Heads up!</b> ${contact.first_name} ${contact.last_name ?? ''} has <b>${selectedVerb}</b> your pet (<b>${petName}</b>)\n`; 
        notificationMessage += `📞 Their phone number is: <b>${contact.phone_number}</b>`;

        for (const ownerId of context.scene.session.pet?.owners ?? []) {
            context.telegram.sendMessage(ownerId, notificationMessage, { parse_mode: 'HTML' });
        }

        context.reply('✔️ Thanks for your help. Your phone has been shared with the owners!');

        return context.scene.leave();
    },
);