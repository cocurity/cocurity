import ScanResultClient from "./ScanResultClient";

type Props = { params: Promise<{ scanId: string }> };

export default async function ScanResultPage({ params }: Props) {
  const { scanId } = await params;
  return <ScanResultClient scanId={scanId} />;
}
