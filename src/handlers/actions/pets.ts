import { ActionHandlerDefinition, HandlerType } from '../../types/handlers';

export const registerPetAction: ActionHandlerDefinition = {
    type: HandlerType.ACTION,
    name: 'Pet registration',
    trigger: 'pet_register',
    callback: async (context) => {
        (context as any).scene.enter('petRegistrationScene');
    },
};