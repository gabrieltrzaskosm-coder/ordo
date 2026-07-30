"use server";

// Ações do atendente. O pedido pelo garçom reusa o mesmo núcleo do pedido do
// cliente (lib/orders/create): valida e recalcula preços a partir da BD. A
// diferença é o ACESSO — aqui é staff autenticado (requireStaff) a escolher a
// mesa, em vez do qr_token anónimo. Cobrar e atender chamadas ficam em
// cozinha/actions (markPaid, resolveWaiterCall), reutilizados no cliente.
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createOrder } from "@/lib/orders/create";

const staffOrderSchema = z.object({
  tableId: z.string().uuid(),
  customerName: z.string().trim().max(80).optional(),
  items: z
    .array(
      z.object({
        menuItemId: z.string().uuid(),
        qty: z.number().int().min(1).max(50),
        notes: z.string().max(280).optional(),
        modifierIds: z.array(z.string().uuid()).max(60).optional(),
      }),
    )
    .min(1),
});

export type StaffOrderResult =
  | { ok: true; orderId: string }
  | { ok: false; error: string };

export async function createStaffOrder(
  input: unknown,
): Promise<StaffOrderResult> {
  const parsed = staffOrderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Pedido inválido." };
  const { tableId, customerName, items } = parsed.data;

  const session = await requireStaff();
  const admin = createAdminClient();

  // Confirma que a mesa é deste estabelecimento antes de criar o pedido.
  const { data: table } = await admin
    .from("restaurant_tables")
    .select("id, label, establishment_id")
    .eq("id", tableId)
    .maybeSingle();
  if (!table || table.establishment_id !== session.establishmentId) {
    return { ok: false, error: "Mesa não encontrada." };
  }

  const res = await createOrder(
    session.establishmentId,
    tableId,
    customerName?.trim() || `Mesa ${table.label}`,
    items,
  );
  if (res.ok) {
    revalidatePath("/atendimento");
    revalidatePath("/cozinha");
  }
  return res;
}
