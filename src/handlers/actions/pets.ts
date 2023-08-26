/* eslint-disable @typescript-eslint/no-explicit-any */
import { ActionHandlerDefinition, HandlerType, SceneID, TriggerType } from '../../types';

export const registerPetAction: ActionHandlerDefinition = {
    type: HandlerType.ACTION,
    name: 'Pet registration',
    trigger: TriggerType.PET_REGISTER,
    callback: async (context) => {
        (context as any).scene.enter(SceneID.PET_REGISTRATION);
    },
};

export const registerPetOwnerAction: ActionHandlerDefinition = {
    type: HandlerType.ACTION,
    name: 'Pet owner registration',
    trigger: TriggerType.PET_OWNER_REGISTER,
    callback: async (context) => {
        (context as any).scene.enter(SceneID.PET_OWNER_REGISTRATION);
    },
};

export const createLostPetReport: ActionHandlerDefinition = {
    type: HandlerType.ACTION,
    name: 'Lost pet report creation',
    trigger: TriggerType.PET_CREATE_LOST_REPORT,
    callback: async (context) => {
        (context as any).scene.enter(SceneID.LOST_REPORT_CREATION);
    },
};