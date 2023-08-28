import { seeOthersReportsAction } from './reports';
import { ActionHandlerDefinition } from '../../types';
import { registerPetAction, registerPetOwnerAction, createLostPetReport, removePetAction, updatePetAction } from './pets';

export const actionHandlers: ActionHandlerDefinition[] = [
    createLostPetReport,
    registerPetAction,
    registerPetOwnerAction,
    removePetAction,
    updatePetAction,
    seeOthersReportsAction,
];