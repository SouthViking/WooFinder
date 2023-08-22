import { Document, ObjectId } from 'mongodb';

import { Coordinates } from './misc';

export interface UserDocument extends Document {
    _id: number;
    firstName?: string;
    lastName?: string;
    isBot: boolean;
    isPremium: boolean;
    languageCode?: string 
    username?: string;
    createdAt: number;
}

export interface PetData {
    owners: number[];
    name: string;
    otherNames?: string[];
    birthDate: number;
    species: ObjectId;
    size: string;
    weight: number;
    description: string;
    pictureRemoteId: string;
    createdAt: number;
}

export type PetDocument = PetData & Document;

export interface SpeciesDocument extends Document {
    name: string;
}

export interface LostPetReportData {
    petId: ObjectId;
    isActive: boolean;
    lastSeen: Coordinates;
    createdAt: number;
    updatedAt?: number;
}

export type LostPetReportDocument = LostPetReportData & Document;