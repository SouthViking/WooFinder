
const MIN_ALLOWED_BIRTHDATE = '2000-01-01';
const MIN_ALLOWED_BIRTHDATE_TIMESTAMP = Date.parse(MIN_ALLOWED_BIRTHDATE);

export const getPetEmojiForSpeciesName = (species: string) => {
    return {
        'dog': '🐶',
        'cat': '🐱',
    }[species.toLowerCase()];
}

export const isValidBirthDate = (birthDate: number): {
    isValid: boolean;
    errorMessage?: string;
} => {
    if (birthDate < MIN_ALLOWED_BIRTHDATE_TIMESTAMP) {
        return { isValid: false, errorMessage: `Invalid birthdate. The date must be greater than ${MIN_ALLOWED_BIRTHDATE}.` };
    }

    if (birthDate > Date.now()) {
        return { isValid: false, errorMessage: 'Invalid birthdate. The date must be less than the current date.' };
    }

    return { isValid: true };
};