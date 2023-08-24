/* eslint-disable @typescript-eslint/no-explicit-any */
import TimeAgo from 'javascript-time-ago';
import { Markup, Scenes } from 'telegraf';
import { Filter, ObjectId } from 'mongodb';
import en from 'javascript-time-ago/locale/en'
import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';

import { storage } from '../../db';
import { getPetEmojiForSpeciesName, sendSceneLeaveText } from '../../utils';
import { ConversationSessionData, Coordinates, LostPetReportDocument, PetDocument, SpeciesDocument } from '../../types';

const MAX_SEARCH_RADIUS_KM = 0.5;

TimeAgo.addDefaultLocale(en)
const timeAgo = new TimeAgo('en-US');

export const seeOthersLostPetReportsScene = new Scenes.WizardScene<Scenes.WizardContext<ConversationSessionData>>(
    'seeOthersLostPetReportsScene',
    async (context) => {
        context.reply('🔎🐾 Send a location to see the list of reports near to it.');
        return context.wizard.next();
    },
    async (context) => {
        const userId = context.from?.id;
        if (!userId) {
            context.reply('⚠️ There has been an error. Please try again later!');
            return context.scene.leave();
        }

        const sourceCoordinates = (context.update as any).message?.location as Coordinates | undefined;
        if (!sourceCoordinates) {
            const possibleMessage = (context.update as any).message?.text as string | undefined;
            if (possibleMessage && possibleMessage.toLowerCase() === 'exit') {
                sendSceneLeaveText(context);
                return context.scene.leave();
            }
            
            context.reply('⚠️ You must provide a valid location.');
            return context.wizard.selectStep(1);
        }

        const petsCollection = storage.getCollection<PetDocument>('pets');
        const userPetsFilter = { 'owners.0': userId};

        const userPetsIds = [];
        for await (const petDoc of petsCollection.find(userPetsFilter)) {
           userPetsIds.push(petDoc._id);
        }

        const reportsCollection = storage.getCollection<LostPetReportDocument>('reports');
        const searchQuery: Filter<LostPetReportDocument> = {
            $and: [
                {
                    lastSeen: {
                        $geoWithin: {
                            $centerSphere: [
                                [sourceCoordinates.longitude, sourceCoordinates.latitude],
                                MAX_SEARCH_RADIUS_KM / 6378.1, // TODO: Make radius custom for users as part of the settings
                            ]
                        }
                    }
                },
                { isActive: true },
                { petId: { $nin: userPetsIds } }
            ]
        };

        const targetPetIds: ObjectId[] = [];
        const reportedDatesMap: Record<string, number> = {};

        for await (const reportDoc of reportsCollection.find(searchQuery)) {
            targetPetIds.push(reportDoc.petId);
            reportedDatesMap[reportDoc.petId.toString()]  = reportDoc.updatedAt ?? reportDoc.createdAt;
        }

        if (targetPetIds.length === 0) {
            context.reply('🔎❌ There are no active reports of lost pets near to the provided location.');
            return context.scene.leave();
        }

        const targetPetQuery: Filter<PetDocument> = {
            _id: { $in: targetPetIds },
        };

        const petSpeciesMap: Record<string, string> = {};
        const speciesCollection = storage.getCollection<SpeciesDocument>('species');
        for await (const speciesDoc of speciesCollection.find()) {
            petSpeciesMap[speciesDoc._id.toString()] = getPetEmojiForSpeciesName(speciesDoc.name);
        }

        const keyboard: InlineKeyboardButton.CallbackButton[][] = [];
        for await (const petDoc of petsCollection.find(targetPetQuery)) {
            const petEmoji = petSpeciesMap[petDoc.species.toString()];
            const elapsedTime = reportedDatesMap[petDoc._id.toString()];
            const reportedTimeAgo = timeAgo.format(new Date(elapsedTime));
            
            const label = petEmoji.length !== 0 ? `${petEmoji} ${petDoc.name} (${reportedTimeAgo})` : petDoc.name;

            keyboard.push([Markup.button.callback(label, petDoc._id.toString())]);
        }

        let foundResultsMessage = '🔎🐾 We have found some results! This is the list of lost pets that are near to the provided location.\n';
        foundResultsMessage += 'Select one to see more detail.';

        context.reply(foundResultsMessage, {
            ...Markup.inlineKeyboard(keyboard),
        });

        return context.wizard.next();
    },
);