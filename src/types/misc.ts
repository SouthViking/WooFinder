import { Scenes } from 'telegraf';

import { PetData } from './models';

export interface ConversationSessionData extends Scenes.WizardSessionData {
    pet?: Partial<PetData>;
}

export type Full<T> = {
    [P in keyof T]-?: T[P];
}