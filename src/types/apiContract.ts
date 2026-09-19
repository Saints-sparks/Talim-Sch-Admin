/**
 * Helper types over `./api.d.ts`.
 *
 * `api.d.ts` is a COPY of the backend's generated contract
 * (`talimBE-V2/docs/api-types.d.ts`, produced by `openapi-typescript` from the
 * controllers and DTOs). Do not edit it here. Refresh it with:
 *
 *   npm run types:api        # copies ../talimBE-V2/docs/api-types.d.ts
 *                            # (or $TALIM_BACKEND_PATH/docs/api-types.d.ts)
 *
 * then run `npm run type-check`. A request payload typed with `RequestBody`
 * fails to compile the moment the backend DTO changes, instead of failing with a
 * 400 in production (the API rejects unknown fields).
 *
 * The response types describe the legacy body of each endpoint; when the API
 * wraps successes as `{ success, data }` the client unwraps them first.
 */
import type { paths } from "./api";

/** HTTP methods that appear in the contract. */
export type ApiMethod = "get" | "post" | "put" | "patch" | "delete";

/** The methods `P` actually defines; a wrong path/method pair fails to compile. */
export type MethodsOf<P extends keyof paths> = {
  [M in ApiMethod]-?: [NonNullable<paths[P][M]>] extends [never] ? never : M;
}[ApiMethod];

type Operation<P extends keyof paths, M extends MethodsOf<P>> = NonNullable<paths[P][M]>;

type JsonContent<T> = T extends { content: { "application/json": infer B } } ? B : never;

/** JSON request body of `METHOD path`; `never` when the operation takes none. */
export type RequestBody<P extends keyof paths, M extends MethodsOf<P> = "post" & MethodsOf<P>> =
  Operation<P, M> extends { requestBody?: infer R } ? JsonContent<NonNullable<R>> : never;

/** Success (200/201 by default) JSON body of `METHOD path`. */
export type ResponseBody<
  P extends keyof paths,
  M extends MethodsOf<P> = "get" & MethodsOf<P>,
  S extends number = 200 | 201,
> = Operation<P, M> extends { responses: infer R } ? JsonContent<R[Extract<keyof R, S>]> : never;

/** Query-string parameters of `METHOD path`. */
export type RequestQuery<P extends keyof paths, M extends MethodsOf<P> = "get" & MethodsOf<P>> =
  Operation<P, M> extends { parameters: { query?: infer Q } } ? NonNullable<Q> : never;

/** A named schema from the contract, e.g. `Schema<"CreateFeeCategoryDto">`. */
export type Schema<N extends keyof import("./api").components["schemas"]> =
  import("./api").components["schemas"][N];
