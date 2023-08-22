import { ActionHandlerDefinition, HandlerType } from '../../types/handlers';

export const registerPetAction: ActionHandlerDefinition = {
    type: HandlerType.ACTION,
    name: 'Pet registration',
    trigger: 'pet_register',
    callback: async (context) => {
        (context as any).scene.enter('petRegistrationScene');
    },
};

export const registerPetOwnerAction: ActionHandlerDefinition = {
    type: HandlerType.ACTION,
    name: 'Pet owner registration',
    trigger: 'pet_owner_register',
    callback: async (context) => {
        (context as any).scene.enter('petOwnerRegistrationScene');
    },
};

export const createLostPetReport: ActionHandlerDefinition = {
    type: HandlerType.ACTION,
    name: 'Lost pet report creation',
    trigger: 'pet_create_lost_report',
    callback: async (context) => {
        (context as any).scene.enter('lostPetReportCreationScene');
    },
};