import TimeAgo from 'javascript-time-ago';
import { Filter, ObjectId } from 'mongodb';
import en from 'javascript-time-ago/locale/en';

import { Storage } from '../db';
import { getPetEmojiForSpeciesName } from './pets';
import { generateTelegramKeyboardWithButtons } from './misc';
import { Coordinates, KeyboardButtonData, LostPetReportDocument, PetDocument, SpeciesDocument } from '../types';
import { Markup } from 'telegraf';

TimeAgo.addLocale(en)
const timeAgo = new TimeAgo('en-US');

export interface GeoLocationInfo {
    /** The source coordinates. They will be the center for the search query. */
    coordinates: Coordinates;
    /** The maximum radius for the search from the center.  */
    radiusKm: number;
}

interface LostPetKeyboardOptions {
    /** Whether the keyboard should contain user's pets exclusively. Default is `false`.  */
    myPets?: boolean;
    /** Whether the keyboard should contain a back button or not. */
    withBackButton: boolean;
}

/**
 *
 * @param storage The storage object to get the data from.
 * @param userId The current user ID.
 * @param locationInfo An object containing the information of the coordinates and radius to execute the search.
 * @param myPets Whether the keyboard should contain user's pets exclusively. Default is `false`.
 * @returns A Telegram keyboard with the pets that have an active lost report within the provided location.
 */
export const getLostPetsKeyboard = async (storage: Storage, userId: number, locationInfo: GeoLocationInfo, options: LostPetKeyboardOptions) => {
    // Find the pets where the owner is the current user ID.
    const userPetsIds = (await storage.findAndGetAll<PetDocument>('pets', { 'owners.0': userId }, { projection: { _id: 1 } })).map(petDoc => (petDoc._id));

    // Query to find the reports that are near to the provided location in a certain radius.
    const searchQuery: Filter<LostPetReportDocument> = {
        $and: [
            {
                lastSeen: {
                    $geoWithin: {
                        $centerSphere: [
                            [locationInfo.coordinates.longitude, locationInfo.coordinates.latitude],
                            locationInfo.radiusKm / 6378.1,
                        ]
                    }
                }
            },
            { isActive: true },
            { petId: options.myPets ? { $in: userPetsIds } : { $nin: userPetsIds } },
        ]
    };

    // List containing the ID of the pets regarding the active reports that were found
    const targetPetIds: ObjectId[] = [];
    // Map of the reports dates to display it with the name in the keyboard (with timeago format)
    const reportedDatesMap: Record<string, number> = {};

    const reportsFound = await storage.findAndGetAll('reports', searchQuery);
    for (const reportDoc of reportsFound) {
        targetPetIds.push(reportDoc.petId);
        reportedDatesMap[reportDoc.petId.toString()]  = reportDoc.updatedAt ?? reportDoc.createdAt;
    }

    const petSpeciesMap: Record<string, string> = {};

    const species = await storage.findAndGetAll<SpeciesDocument>('species', {});
    for (const speciesDoc of species) {
        petSpeciesMap[speciesDoc._id.toString()] = getPetEmojiForSpeciesName(speciesDoc.name);
    }

    const targetPets: KeyboardButtonData[] = (await storage.findAndGetAll<PetDocument>('pets', { _id: { $in: targetPetIds } })).map(petDoc => {
        const petEmoji = petSpeciesMap[petDoc.species.toString()];
        const elapsedTime = reportedDatesMap[petDoc._id.toString()];
        const reportedTimeAgo = timeAgo.format(new Date(elapsedTime));

        const label = petEmoji.length !== 0 ? `${petEmoji} ${petDoc.name} (${reportedTimeAgo})` : petDoc.name;
        
        return {
            text: label,
            data: petDoc._id.toString(),
        };
    });

    const keyboard =  generateTelegramKeyboardWithButtons(targetPets, 1);

    if (options.withBackButton) {
        keyboard.push([ Markup.button.callback('Back', 'back') ]);
    }

    return keyboard;
};