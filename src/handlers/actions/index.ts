import { ActionHandlerDefinition } from '../../types';
import { registerPetAction, registerPetOwnerAction, createLostPetReport } from './pets';

export const actionHandlers: ActionHandlerDefinition[] = [
    createLostPetReport,
    registerPetAction,
    registerPetOwnerAction,
];