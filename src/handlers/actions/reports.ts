/* eslint-disable @typescript-eslint/no-explicit-any */
import { ActionHandlerDefinition, HandlerType, Scenes, TriggerType } from '../../types';

export const seeOthersReportsAction: ActionHandlerDefinition = {
    type: HandlerType.ACTION,
    name: 'See other\'s reports',
    trigger: TriggerType.DISPLAY_OTHERS_LOST_REPORTS,
    callback: async (context) => {
        (context as any).scene.enter(Scenes.DISPLAY_OTHERS_LOST_REPORT);
    },
};

export const seeMyReportsAction: ActionHandlerDefinition = {
    type: HandlerType.ACTION,
    name: 'See my own reports',
    trigger: TriggerType.DISPLAY_MY_LOST_REPORTS,
    callback: async (context) => {
        (context as any).scene.enter(Scenes.DISPLAY_MY_LOST_REPORTS);
    },
};