declare module 'mammoth' {
  interface ExtractOptions {
    buffer?: Buffer;
    path?: string;
    arrayBuffer?: ArrayBuffer;
  }
  
  interface Result {
    value: string;
    warnings: Array<{
      type: string;
      message: string;
      [key: string]: any;
    }>;
  }
  
  export function extractRawText(options: ExtractOptions): Promise<Result>;
  export function convertToHtml(options: ExtractOptions): Promise<Result>;
}