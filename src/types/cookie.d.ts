declare module 'cookie' {
    export function parse(str: string): { [key: string]: string };
    export function serialize(name: string, val: string, options?: { [key: string]: any }): string;
}
