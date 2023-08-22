import { Context } from 'telegraf';

type HandlerFunc = (ctx: Context) => Promise<void>;

export enum HandlerType {
    COMMAND,
    ACTION,
};

export interface BaseHandlerDefinition {
    name: string;
    description?: string;
    callback: HandlerFunc;
};

export interface CommandHandlerDefinition extends BaseHandlerDefinition {
    type: HandlerType.COMMAND;
    command: string;
};

export interface ActionHandlerDefinition extends BaseHandlerDefinition {
    type: HandlerType.ACTION;
    trigger: string;
};

export type HandlerDefinition = CommandHandlerDefinition | ActionHandlerDefinition;