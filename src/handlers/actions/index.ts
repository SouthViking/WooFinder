import { ActionHandlerDefinition } from '../../types/handlers';
import { registerPetAction, registerPetOwnerAction, createLostPetReport } from './pets';

export const actionHandlers: ActionHandlerDefinition[] = [
    createLostPetReport,
    registerPetAction,
    registerPetOwnerAction,
];