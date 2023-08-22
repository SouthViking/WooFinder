import { petsMenu } from './pets';
import { startHandlerDef } from './start';
import { CommandHandlerDefinition } from '../../types';

export const commandHandlers: CommandHandlerDefinition[] = [
    startHandlerDef,
    petsMenu,
];