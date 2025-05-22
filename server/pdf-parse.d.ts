declare module 'pdf-parse' {
  interface PDFData {
    text: string;
    numpages: number;
    info: Record<string, unknown>;
    metadata: Record<string, unknown>;
  }

  export default function(dataBuffer: Buffer, options?: Record<string, unknown>): Promise<PDFData>;
}