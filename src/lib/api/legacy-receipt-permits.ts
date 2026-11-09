import type { PrivateRequest } from "@/types/api";
import type {
  LegacyReceiptPermitCreatePayload,
  LegacyReceiptPermitCreateResult,
} from "@/types/legacy-receipt-permit";

const legacyReceiptPermitsApi = {
  async create({
    privateRequest,
    file,
    payload,
  }: {
    privateRequest: PrivateRequest;
    file: File;
    payload: LegacyReceiptPermitCreatePayload;
  }) {
    const data = new FormData();
    data.append("pdf", file);
    data.append("payload", JSON.stringify(payload));

    return await privateRequest<LegacyReceiptPermitCreateResult>({
      url: "legacy-receipt-permits",
      method: "POST",
      data,
    });
  },
};

export default legacyReceiptPermitsApi;
