// remove cod colors from a string
declare global {
    interface String {
        removeCodColors(): string;
    }
}
String.prototype.removeCodColors = function(): string
{
    return this.replace(/\^\d/, "");
}


// wait code execution for "x" milliseconds
export async function wait(ms: number)
{
    return new Promise((res) => setTimeout(res, ms));
}

// instantly kill app process
export function kill()
{
    return process.exit(1);
}

