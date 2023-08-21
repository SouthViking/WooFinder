import { Document, ObjectId } from 'mongodb';

export interface UserDocument extends Document {
    _id: number;
    firstName?: string;
    lastName?: string;
    isBot: boolean;
    isPremium: boolean;
    languageCode?: string 
    username?: string;
    chatId: number;
    createdAt: number;
};

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