import { Context, Middleware } from 'telegraf'
import { Update } from 'telegraf/typings/core/types/typegram'

export const errorHandler: Middleware<Context<Update>> = async (context, next) => {
    try {
        await next();
    } catch (err: unknown) {
        console.log(`Error middleware detected the following error: ${err}`);
        context.reply('😔 There has been an internal error. Please try again later!');
    }
}