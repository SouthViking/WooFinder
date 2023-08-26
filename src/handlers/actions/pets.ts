/* eslint-disable @typescript-eslint/no-explicit-any */
import { ActionHandlerDefinition, HandlerType, SceneID } from '../../types';

export const registerPetAction: ActionHandlerDefinition = {
    type: HandlerType.ACTION,
    name: 'Pet registration',
    trigger: 'pet_register',
    callback: async (context) => {
        (context as any).scene.enter(SceneID.PET_REGISTRATION);
    },
};

export const registerPetOwnerAction: ActionHandlerDefinition = {
    type: HandlerType.ACTION,
    name: 'Pet owner registration',
    trigger: 'pet_owner_register',
    callback: async (context) => {
        (context as any).scene.enter(SceneID.PET_OWNER_REGISTRATION);
    },
};

export const createLostPetReport: ActionHandlerDefinition = {
    type: HandlerType.ACTION,
    name: 'Lost pet report creation',
    trigger: 'pet_create_lost_report',
    callback: async (context) => {
        (context as any).scene.enter(SceneID.LOST_REPORT_CREATION);
    },
};