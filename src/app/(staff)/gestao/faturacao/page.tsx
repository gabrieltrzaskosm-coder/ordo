import { getInvoicingStatus } from "./actions";
import { FaturacaoManager } from "./FaturacaoManager";

export const dynamic = "force-dynamic";

export default async function FaturacaoPage() {
  const status = await getInvoicingStatus();
  return <FaturacaoManager status={status} />;
}
