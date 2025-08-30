
declare module 'google-trends-api' {
  export function interestOverTime(params: { keyword: string, startTime: Date, endTime: Date, geo: string }): Promise<any>;
  export function relatedQueries(params: any): Promise<any>;
  export function trendingSearches(params: { geo: string }): Promise<string>;
  export function interestByRegion(params: any): Promise<any>;
  export function interestByCity(params: any): Promise<any>;
}
