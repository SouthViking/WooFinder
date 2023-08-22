import { actionHandlers } from './actions';
import { commandHandlers } from './commands';
import { HandlerDefinition } from '../types';

export const handlers: HandlerDefinition[] = [
    ...commandHandlers,
    ...actionHandlers,
];