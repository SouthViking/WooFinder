/* eslint-disable @typescript-eslint/no-explicit-any */
import { ActionHandlerDefinition, HandlerType, SceneID, TriggerType } from '../../types';

export const seeOthersReportsAction: ActionHandlerDefinition = {
    type: HandlerType.ACTION,
    name: 'See other\'s reports',
    trigger: TriggerType.DISPLAY_OTHERS_LOST_REPORTS,
    callback: async (context) => {
        (context as any).scene.enter(SceneID.DISPLAY_OTHERS_LOST_REPORT);
    },
};