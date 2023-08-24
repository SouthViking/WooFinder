/* eslint-disable @typescript-eslint/no-explicit-any */
import { ActionHandlerDefinition, HandlerType } from '../../types';

export const seeOthersReportsAction: ActionHandlerDefinition = {
    type: HandlerType.ACTION,
    name: 'See other\'s reports',
    trigger: 'see_others_reports',
    callback: async (context) => {
        (context as any).scene.enter('seeOthersLostPetReportsScene');
    },
};