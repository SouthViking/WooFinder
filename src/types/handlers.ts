import { Context } from 'telegraf';

type HandlerFunc = (ctx: Context) => Promise<void>;

export enum HandlerType {
    COMMAND,
    ACTION,
}

export interface HandlerDefinition {
    type: HandlerType;
    name: string;
    command: string;
    description?: string;
    callback: HandlerFunc;
};