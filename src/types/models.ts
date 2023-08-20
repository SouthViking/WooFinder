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
};

export interface PetDocument extends Document {
    owners: number[];
    name: string;
    otherNames?: string[];
    birthDate: Date;
    species: ObjectId;
    size: 'small' | 'medium' | 'large' | 'giant'
    weight: number;
    description: string;
    picturePath?: string;
};

export interface SpeciesDocument extends Document {
    name: string;
}