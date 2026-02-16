import VerifyDetailClient from "./VerifyDetailClient";

type Props = { params: Promise<{ certId: string }> };

export default async function VerifyDetailPage({ params }: Props) {
  const { certId } = await params;
  return <VerifyDetailClient certId={certId} />;
}
