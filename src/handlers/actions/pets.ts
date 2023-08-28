/* eslint-disable @typescript-eslint/no-explicit-any */
import { ActionHandlerDefinition, HandlerType, Scenes, TriggerType } from '../../types';

export const registerPetAction: ActionHandlerDefinition = {
    type: HandlerType.ACTION,
    name: 'Pet registration',
    trigger: TriggerType.PET_REGISTER,
    callback: async (context) => {
        (context as any).scene.enter(Scenes.PET_REGISTRATION);
    },
};

export const registerPetOwnerAction: ActionHandlerDefinition = {
    type: HandlerType.ACTION,
    name: 'Pet owner registration',
    trigger: TriggerType.PET_OWNER_REGISTER,
    callback: async (context) => {
        (context as any).scene.enter(Scenes.PET_OWNER_REGISTRATION);
    },
};

export const createLostPetReport: ActionHandlerDefinition = {
    type: HandlerType.ACTION,
    name: 'Lost pet report creation',
    trigger: TriggerType.PET_CREATE_LOST_REPORT,
    callback: async (context) => {
        (context as any).scene.enter(Scenes.LOST_REPORT_CREATION);
    },
};

export const removePetAction: ActionHandlerDefinition = {
    type: HandlerType.ACTION,
    name: 'Remove pet',
    trigger: TriggerType.PET_REMOVE,
    callback: async (context) => {
        (context as any).scene.enter(Scenes.PET_REMOVE);
    },
};

export const updatePetAction: ActionHandlerDefinition = {
    type: HandlerType.ACTION,
    name: 'Update pet',
    trigger: TriggerType.PET_UPDATE,
    callback: async (context) => {
        (context as any).scene.enter(Scenes.PET_UPDATE);
    },
};