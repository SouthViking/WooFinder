import { Scenes } from 'telegraf';

import { PetData } from './models';

export interface ConversationSessionData extends Scenes.WizardSessionData {
    targetId?: string;
    pet?: Partial<PetData>;
}

export type Full<T> = {
    [P in keyof T]-?: T[P];
};

export type Coordinates = { latitude: number; longitude: number; altitude?: number };

export interface KeyboardButtonData {
    text: string;
    data: string;
    hide?: boolean;
}