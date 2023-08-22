import { registerPetAction } from './pets';
import { ActionHandlerDefinition } from '../../types/handlers';

export const actionHandlers: ActionHandlerDefinition[] = [
    registerPetAction,
];