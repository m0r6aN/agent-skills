/**
 * `@foreman-line/kernel-contracts` — FK-P1 contract surface.
 *
 * Contract-only: types, closed draft-07 schemas, the byte-total canonical
 * encoder, pure structural/semantic validators and the golden-vector shapes.
 * No evaluator, no admission implementation, no runtime authority, no
 * filesystem/network/time/process side effects in the runtime modules.
 */

export * from './canonical.js'
export * from './schemas.js'
export * from './types.js'
export * from './validate.js'
