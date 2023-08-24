import { petsMenu } from './pets';
import { reportsMenu } from './reports';
import { startHandlerDef } from './start';
import { CommandHandlerDefinition } from '../../types';

export const commandHandlers: CommandHandlerDefinition[] = [
    startHandlerDef,
    petsMenu,
    reportsMenu,
];