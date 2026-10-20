declare module "papaparse" {
  export type ParseError = { row?: number; message: string };
  export type ParseResult<T> = { data: T[]; errors: ParseError[] };
  export function parse<T>(input: string, config: { header: boolean; skipEmptyLines: boolean }): ParseResult<T>;
}
