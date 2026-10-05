/** "1 página" / "3 páginas". */
export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`
