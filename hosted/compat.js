export const randomUUID = () => crypto.randomUUID();
export function timingSafeEqual(a,b) { let diff=a.length^b.length; for(let i=0;i<a.length;i++)diff|=a[i]^(b[i]??0); return diff===0; }
export const existsSync=()=>false;
export const dirname=()=>'';
export const mkdirSync=()=>{throw new Error('Hosted state must use D1.');};
export const readFileSync=mkdirSync,renameSync=mkdirSync,writeFileSync=mkdirSync;
