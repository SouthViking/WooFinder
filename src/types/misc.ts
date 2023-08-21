import { Scenes } from 'telegraf';
import { Document } from 'telegraf/typings/core/types/typegram';

import { PetData } from './models';

export interface ConversationSessionData extends Scenes.WizardSessionData {
    pet?: Partial<PetData & { pictureMetadata: Document }>;
}

export type Full<T> = {
    [P in keyof T]-?: T[P];
}