import { Certificate } from "@prisma/client";

export type VerifyStatus = "valid" | "revoked" | "expired" | "not_found";

export function resolveCertificateStatus(certificate: Certificate): VerifyStatus {
  if (certificate.revokedAt) {
    return "revoked";
  }
  if (certificate.expiresAt && certificate.expiresAt.getTime() < Date.now()) {
    return "expired";
  }
  return "valid";
}
