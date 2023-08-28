import { ObjectId } from 'mongodb';

import { AppCollections, storage } from '../db';
import { ConversationSessionData } from '../types';
import { Scenes } from 'telegraf';

const PET_NAME_MAX_LENGTH_ALLOWED = 20;
const MIN_ALLOWED_BIRTHDATE = '2000-01-01';
export const MAX_SECONDARY_PET_NAMES_ALLOWED = 5;
const MIN_ALLOWED_BIRTHDATE_TIMESTAMP = Date.parse(MIN_ALLOWED_BIRTHDATE);

interface ValidResult<T> {
    isValid: true;
    errorMessage?: undefined;
    validatedValue: T;
}

interface InvalidResult {
    isValid: false;
    errorMessage: string;
}

export type ValidationResult<T> = ValidResult<T> | InvalidResult;

export const validatePetSpecies = async (id: string): Promise<ValidationResult<string>> => {
    if (!ObjectId.isValid(id)) {
        return { isValid: false, errorMessage: 'The selected option is not valid.' };
    }

    const speciesRecord = await storage.findOne(AppCollections.SPECIES, { _id: new ObjectId(id) });
    if (speciesRecord === null) {
        return { isValid: false, errorMessage: 'The species is not defined.' };
    }
    
    return { isValid: true, validatedValue: id };
};

export const validatePetName = (name: string): ValidationResult<string> => {
    if (name.length <= 0) {
        return { isValid: false, errorMessage: 'The name cannot be empty.' };
    }
    if (name.length > PET_NAME_MAX_LENGTH_ALLOWED) {
        return {
            isValid: false,
            errorMessage: `The name cannot be longer than ${PET_NAME_MAX_LENGTH_ALLOWED} characters.`,
        }
    }

    return { isValid: true, validatedValue: name };
};

export const validatePetBirthDate = (birthDate: string): ValidationResult<number> => {
    const parsedBirthDate = Date.parse(birthDate);
    if (isNaN(parsedBirthDate)) {
        return { isValid: false, errorMessage: 'The date format is not valid.' };
    }

    if (parsedBirthDate < MIN_ALLOWED_BIRTHDATE_TIMESTAMP) {
        return { isValid: false, errorMessage: `Invalid birthdate. The date must be greater than ${MIN_ALLOWED_BIRTHDATE}.` };
    }

    if (parsedBirthDate > Date.now()) {
        return { isValid: false, errorMessage: 'Invalid birthdate. The date must be less than the current date.' };
    }

    return { isValid: true, validatedValue: parsedBirthDate };
};

export const validatePetSize = (size: string): ValidationResult<string> => {
    if (['small', 'medium', 'large', 'giant'].indexOf(size) === -1) {
        return { isValid: false, errorMessage: 'The provided size is not valid.' };
    }

    return { isValid: true, validatedValue: size };
};

export const validatePetWeight = (weight: string): ValidationResult<number> => {
    const parsedWeight = parseFloat(weight);
    if (isNaN(parsedWeight)) {
        return { isValid: false, errorMessage: 'The weight must be a number.' };
    }
    if (parsedWeight <= 0) {
        return { isValid: false, errorMessage: 'The weight must be a positive number.' };
    }

    return { isValid: true, validatedValue: parsedWeight };
};

export const validateOtherPetNames = (names: string): ValidationResult<string[]> => {
    const otherNames = names.split(' ').slice(0, MAX_SECONDARY_PET_NAMES_ALLOWED);

    return { isValid: true, validatedValue: otherNames };
};

export const validatePetPictureId = async (context: Scenes.WizardContext<ConversationSessionData>, pictureId: string): Promise<ValidationResult<string>> => {
    try {
        await context.telegram.getFileLink(pictureId); 
        return { isValid: true, validatedValue: pictureId };

    } catch (err: unknown) {
        return { isValid: false, errorMessage: 'The file is not valid.' };
    }
}