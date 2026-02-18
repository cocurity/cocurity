import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { put } from "@vercel/blob";
import { Resvg, type ResvgRenderOptions } from "@resvg/resvg-js";
import QRCode from "qrcode";
import { INTER_REGULAR, INTER_BOLD } from "./fonts";

type FontOptions = NonNullable<ResvgRenderOptions["font"]> & { fontBuffers?: Buffer[] };

const fontData = {
  regular: INTER_REGULAR,
  bold: INTER_BOLD,
  regularB64: INTER_REGULAR.toString("base64"),
  boldB64: INTER_BOLD.toString("base64"),
};

function loadFonts() {
  return fontData;
}

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function buildCertId() {
  const bytes = randomBytes(5);
  let bits = "";
  for (const byte of bytes) {
    bits += byte.toString(2).padStart(8, "0");
  }

  let encoded = "";
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5).padEnd(5, "0");
    encoded += BASE32_ALPHABET[Number.parseInt(chunk, 2)];
  }

  const normalized = encoded.slice(0, 8);
  return `LP-${normalized.slice(0, 4)}-${normalized.slice(4, 8)}`;
}

type CertificateRenderInput = {
  certId: string;
  issuedAt: Date;
  repoUrl: string;
  commitHash: string;
  score: number;
  grade: string;
  verifyUrl: string;
};

function escapeHtml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function buildCertificateSvg(input: CertificateRenderInput, fonts: Awaited<ReturnType<typeof loadFonts>>) {
  const qrDataUrl = await QRCode.toDataURL(input.verifyUrl, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 180,
  });

  const commit7 = input.commitHash.slice(0, 7);
  const issued = input.issuedAt.toISOString();

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
  <defs>
    <style>
      @font-face {
        font-family: 'Inter';
        font-weight: 400;
        src: url('data:font/woff2;base64,${fonts.regularB64}') format('woff2');
      }
      @font-face {
        font-family: 'Inter';
        font-weight: 700;
        src: url('data:font/woff2;base64,${fonts.boldB64}') format('woff2');
      }
    </style>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f8fafc"/>
      <stop offset="100%" stop-color="#e2e8f0"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="675" fill="url(#bg)" />
  <rect x="32" y="32" width="1136" height="611" rx="18" fill="#ffffff" stroke="#0f172a" stroke-width="2" />
  <text x="72" y="108" font-family="Inter" font-size="42" font-weight="700" fill="#0f172a">Cocurity Security Certificate</text>
  <text x="72" y="154" font-family="Inter" font-size="24" fill="#334155">Certificate ID: ${escapeHtml(input.certId)}</text>
  <text x="72" y="196" font-family="Inter" font-size="20" fill="#334155">Issued At: ${escapeHtml(issued)}</text>
  <text x="72" y="244" font-family="Inter" font-size="22" font-weight="700" fill="#0f172a">Repository Summary</text>
  <text x="72" y="286" font-family="Inter" font-size="20" fill="#334155">Repo URL: ${escapeHtml(input.repoUrl)}</text>
  <text x="72" y="326" font-family="Inter" font-size="20" fill="#334155">Commit (7): ${escapeHtml(commit7)}</text>
  <text x="72" y="366" font-family="Inter" font-size="20" fill="#334155">Score: ${input.score}</text>
  <text x="72" y="406" font-family="Inter" font-size="20" fill="#334155">Grade: ${escapeHtml(input.grade)}</text>
  <text x="72" y="470" font-family="Inter" font-size="20" fill="#334155">Verify URL:</text>
  <text x="72" y="505" font-family="Inter" font-size="17" fill="#1d4ed8">${escapeHtml(input.verifyUrl)}</text>
  <image href="${qrDataUrl}" x="930" y="420" width="200" height="200" />
  <text x="930" y="640" font-family="Inter" font-size="16" fill="#334155">Scan QR to verify</text>
</svg>`;
}

export async function renderCertificateImage(input: CertificateRenderInput) {
  const fonts = await loadFonts();
  const svg = await buildCertificateSvg(input, fonts);
  const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

  try {
    const font: FontOptions = {
      fontBuffers: [fonts.regular, fonts.bold],
      loadSystemFonts: false,
      defaultFontFamily: "Inter",
    };
    const resvg = new Resvg(svg, {
      fitTo: { mode: "width", value: 1200 },
      font,
    });
    const pngBuffer = Buffer.from(resvg.render().asPng());

    if (useBlob) {
      const blob = await put(`certs/${input.certId}.png`, pngBuffer, {
        access: "public",
        contentType: "image/png",
      });
      return { imagePath: blob.url, format: "png" as const };
    }

    const certDir = join(process.cwd(), "public", "certs");
    await mkdir(certDir, { recursive: true });
    await writeFile(join(certDir, `${input.certId}.png`), pngBuffer);
    return { imagePath: `/certs/${input.certId}.png`, format: "png" as const };
  } catch (error) {
    console.warn("PNG rendering failed, falling back to SVG certificate output.", error);

    if (useBlob) {
      const blob = await put(`certs/${input.certId}.svg`, svg, {
        access: "public",
        contentType: "image/svg+xml",
      });
      return { imagePath: blob.url, format: "svg" as const };
    }

    const certDir = join(process.cwd(), "public", "certs");
    await mkdir(certDir, { recursive: true });
    await writeFile(join(certDir, `${input.certId}.svg`), svg);
    return { imagePath: `/certs/${input.certId}.svg`, format: "svg" as const };
  }
}
