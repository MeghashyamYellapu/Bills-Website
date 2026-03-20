import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type ReceiptInput } from "@shared/routes";
import type { Receipt } from "@shared/schema";

const receiptsQueryKey = [api.receipts.list.path] as const;

export function useReceipts() {
  return useQuery({
    queryKey: receiptsQueryKey,
    queryFn: async () => {
      const res = await fetch(api.receipts.list.path);
      if (!res.ok) throw new Error("Failed to fetch receipts");
      return api.receipts.list.responses[200].parse(await res.json());
    },
  });
}

export function useReceipt(id: number) {
  return useQuery({
    queryKey: [api.receipts.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.receipts.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch receipt");
      return api.receipts.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: ReceiptInput) => {
      const res = await fetch(api.receipts.create.path, {
        method: api.receipts.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.receipts.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create receipt");
      }
      return api.receipts.create.responses[201].parse(await res.json());
    },
    onSuccess: (createdReceipt) => {
      queryClient.setQueryData<Receipt[]>(receiptsQueryKey, (previousReceipts) => {
        if (!previousReceipts) return [createdReceipt];
        return [createdReceipt, ...previousReceipts];
      });
    },
  });
}

export function useDeleteReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.receipts.delete.path, { id });
      const res = await fetch(url, { method: api.receipts.delete.method });
      if (!res.ok) throw new Error("Failed to delete receipt");
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData<Receipt[]>(receiptsQueryKey, (previousReceipts) => {
        if (!previousReceipts) return previousReceipts;
        return previousReceipts.filter((receipt) => receipt.id !== deletedId);
      });
    },
  });
}
