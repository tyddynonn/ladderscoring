export function Log(message?: any, ...optionalParams: any[]):void {
    if (process.env.NODE_ENV !== 'production') {
        console.log(message, optionalParams);
    }
}