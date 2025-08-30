 
declare module 'google-trends-api' {
  export function interestOverTime(params: any): Promise<any>;
  export function relatedQueries(params: any): Promise<any>;
  export function interestByRegion(params: any): Promise<any>;
  export function interestByCity(params: any): Promise<any>;
}
