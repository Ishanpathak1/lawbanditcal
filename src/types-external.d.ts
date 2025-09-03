declare module 'pdf-parse' {
  export interface PDFParseResult {
    text: string;
  }
  function pdf(input: Buffer | Uint8Array): Promise<PDFParseResult>;
  export default pdf;
}

declare module 'mammoth' {
  export interface MammothResult {
    value: string;
    messages?: Array<{ type: string; message: string }>;
  }
  export function extractRawText(options: { buffer: Buffer | Uint8Array }): Promise<MammothResult>;
  const _default: any;
  export default _default;
}


