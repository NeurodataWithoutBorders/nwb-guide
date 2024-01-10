type PossiblePromise = Promise<any> | any

type ResolveCallback = (object: any, wasPromise?: true) => any

export const isPromise = (p: PossiblePromise) => typeof p === 'object' && typeof p.then === 'function'

export const resolve = (object: PossiblePromise, callback: ResolveCallback)  => (isPromise(object)) ? object.then((value:any) => callback(value, true)) : callback(object)

export const resolveAll = (arr: PossiblePromise[], callback: ResolveCallback) => arr.find(object => isPromise(object)) ? Promise.all(arr).then((arr:any[]) => callback(arr, true)) : callback(arr)
