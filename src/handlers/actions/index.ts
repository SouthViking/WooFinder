import { ActionHandlerDefinition } from '../../types/handlers';
import { registerPetAction, registerPetOwnerAction } from './pets';

export const actionHandlers: ActionHandlerDefinition[] = [
    registerPetAction,
    registerPetOwnerAction
];