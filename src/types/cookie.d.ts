declare module 'cookie' {
    export function parse(str: string): { [key: string]: string };
    /** Options the cookie package accepts when serialising a value. */
    export interface SerializeOptions {
        maxAge?: number;
        expires?: Date;
        path?: string;
        domain?: string;
        secure?: boolean;
        httpOnly?: boolean;
        sameSite?: boolean | 'lax' | 'strict' | 'none';
        [key: string]: unknown;
    }
    export function serialize(name: string, val: string, options?: SerializeOptions): string;
}
