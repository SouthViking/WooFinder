import { Markup } from 'telegraf';
import TimeAgo from 'javascript-time-ago';
import { Filter, ObjectId } from 'mongodb';
import en from 'javascript-time-ago/locale/en';

import { AppCollections, Storage } from '../db';
import { getPetEmojiForSpeciesName } from './pets';
import { generateTelegramKeyboardWithButtons } from './misc';
import { Coordinates, KeyboardButtonData, LostPetReportDocument, PetDocument, SpeciesDocument } from '../types';

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
    const userPetsIds = (await storage.findAndGetAll<PetDocument>(AppCollections.PETS, { 'owners.0': userId }, { projection: { _id: 1 } })).map(petDoc => (petDoc._id));

    // List containing the ID of the pets regarding the active reports that were found
    const targetPetIds: ObjectId[] = [];
    // Map of the reports dates to display it with the name in the keyboard (with timeago format)
    const reportedDatesMap: Record<string, number> = {};

    const lostPetReports = await getLostPetReportsNearToLocation(storage, locationInfo, userPetsIds);
    for (const reportDoc of lostPetReports) {
        targetPetIds.push(reportDoc.petId);
        reportedDatesMap[reportDoc.petId.toString()]  = reportDoc.updatedAt ?? reportDoc.createdAt;
    }

    const species = await storage.findAndGetAllAsObject<SpeciesDocument>(AppCollections.SPECIES, {});

    const targetPets: KeyboardButtonData[] = (await storage.findAndGetAll<PetDocument>(AppCollections.PETS, { _id: { $in: targetPetIds } })).map(petDoc => {
        const elapsedTime = reportedDatesMap[petDoc._id.toString()];
        const reportedTimeAgo = timeAgo.format(new Date(elapsedTime));
        const petEmoji = getPetEmojiForSpeciesName(species[petDoc.species.toString()]?.name ?? '');

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

export const getLostPetReportsNearToLocation = async (storage: Storage, location: GeoLocationInfo, petsToExclude: ObjectId[] = []) => {
    // Query to find the reports that are near to the provided location in a certain radius.
    const searchQuery: Filter<LostPetReportDocument> = {
        $and: [
            {
                lastSeen: {
                    $geoWithin: {
                        $centerSphere: [
                            [location.coordinates.longitude, location.coordinates.latitude],
                            location.radiusKm / 6378.1,
                        ]
                    }
                }
            },
            { isActive: true },
        ]
    };

    if (petsToExclude.length !== 0) {
        searchQuery.$and!.push({ petId: { $nin: petsToExclude } });
    }

    return await storage.findAndGetAll(AppCollections.REPORTS, searchQuery);
};