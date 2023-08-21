import { actionHandlers } from './actions';
import { commandHandlers } from './commands';
import { HandlerDefinition } from '../types/handlers';

export const handlers: HandlerDefinition[] = [
    ...commandHandlers,
    ...actionHandlers,
];