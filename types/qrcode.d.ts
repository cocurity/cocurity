declare module "qrcode" {
  interface QRCodeToDataURLOptions {
    errorCorrectionLevel?: "L" | "M" | "Q" | "H";
    margin?: number;
    width?: number;
    color?: { dark?: string; light?: string };
  }

  interface QRCodeToStringOptions {
    type?: "svg" | "utf8" | "terminal";
    errorCorrectionLevel?: "L" | "M" | "Q" | "H";
    margin?: number;
    width?: number;
  }

  export function toDataURL(
    text: string,
    options?: QRCodeToDataURLOptions
  ): Promise<string>;

  export function toString(
    text: string,
    options?: QRCodeToStringOptions
  ): Promise<string>;

  export function toCanvas(
    canvas: HTMLCanvasElement,
    text: string,
    options?: QRCodeToDataURLOptions
  ): Promise<void>;

  const QRCode: {
    toDataURL: typeof toDataURL;
    toString: typeof toString;
    toCanvas: typeof toCanvas;
  };

  export default QRCode;
}
