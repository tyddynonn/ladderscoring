export function Log(message?: any, ...optionalParams: any[]):void {
    if (process.env.NODE_ENV === 'development') {
        console.log(message, ...optionalParams);
    }
}
export function LogWarning(message?: any, ...optionalParams: any[]):void {
    if (process.env.NODE_ENV === 'development') {
        console.warn(message, ...optionalParams);
    }
}

export function LogError(message?: any, ...optionalParams: any[]):void {
    // always output errors 
        console.error(message, ...optionalParams);
}

export function LogAssert(condition?: boolean | undefined, ...data: any[]):void {
    if (process.env.NODE_ENV === 'development') {
        console.assert(condition, ...data);
    }
}