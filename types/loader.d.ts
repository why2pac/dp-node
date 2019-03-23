export type PrimitiveType = undefined | null | number | string | boolean | symbol
export type NonFunctionType = PrimitiveType | NonFunctionObject
export type NonFunctionObject = (
  { bind?: NonFunctionType } |
  { apply?: NonFunctionType } |
  { call?: NonFunctionType });

export interface ModulePlainMethod<C> {
  (this: C, ...args: never[]): unknown
}
export interface ModuleArrowMethod<C> {
  (this: unknown, that: C, ...args: never[]): unknown
  prototype?: PrimitiveType
}
export type ModuleMethod<C> = ModulePlainMethod<C> | ModuleArrowMethod<C>
export interface ModuleLoadizable<C> {
  [key: string]: ModuleMethod<C> | NonFunctionType
}

export type LoadedProxy<M extends ModuleLoadizable<C>, C = M extends ModuleLoadizable<infer R> ? R : never> = {
  [K in string & keyof M]: (
    M[K] extends (this: unknown, that: C, ...args: infer A) => infer R
      ? /* arrow */ (this: unknown, ...args: A) => R
      : M[K] extends (this: C, ...args: infer A) => infer R
        ? /* normal */ (this: unknown, ...args: A) => R
        : M[K] & NonFunctionType
  )
}

export interface ModuleSpecMap {
  [key: string]: ModuleSpec
}

export interface ModuleSpec {
  members: object
  children: ModuleSpecMap
}

type MemberType<C, MS extends ModuleSpec, K extends keyof MS['children']> = SpecToType<
    DescendContextMixin<C, MS, K> & Pick<C, Exclude<keyof C, '_' | '__'>>,
    MS['children'][K]>

interface DescendContextMixin<C, MS extends ModuleSpec, K extends keyof MS['children']> {
  _: LoadedProxy<SpecToType<this, MS['children'][K]>, this>
  __: LoadedProxy<SpecToType<C, MS>, C>
}

type SpecToType<C, MS extends ModuleSpec> = MS['members'] & {
  [K in keyof MS['children']]: MemberType<C, MS, K>
}

export type ModuleHierarchy<C, MSM extends ModuleSpecMap> = {
  [K in keyof MSM]: SpecToType<C, MSM[K]>
};
