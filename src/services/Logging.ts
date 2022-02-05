export function Log(message?: any, ...optionalParams: any[]):void {
    if (process.env.NODE_ENV !== 'production') {
        console.log(message, ...optionalParams);
    }
}
export function LogWarning(message?: any, ...optionalParams: any[]):void {
    if (process.env.NODE_ENV !== 'production') {
        console.warn(message, ...optionalParams);
    }
}

export function LogError(message?: any, ...optionalParams: any[]):void {
    // always output errors 
        console.error(message, ...optionalParams);
}

export function LogAssert(condition?: boolean | undefined, ...data: any[]):void {
    if (process.env.NODE_ENV !== 'production') {
        console.assert(condition, ...data);
    }
}