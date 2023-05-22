type PossiblePromise = Promise<any> | any

type ResolveCallback = (o: any, wasPromise?: true) => any

export const isPromise = (p: PossiblePromise) => typeof p === 'object' && typeof p.then === 'function'
  
export const resolve = (o: PossiblePromise, callback: ResolveCallback)  => (isPromise(o)) ? o.then((v:any) => callback(v, true)) : callback(o)

export const resolveAll = (arr: PossiblePromise[], callback: ResolveCallback) => arr.find(o => isPromise(o)) ? Promise.all(arr).then((arr:any[]) => callback(arr, true)) : callback(arr)