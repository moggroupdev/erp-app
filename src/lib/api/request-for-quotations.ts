import type { Dictionary, PrivateRequest } from "@/types/api";
import type { PaginatedData } from "@/types/global";
import type {
  CreateRequestForQuotationDto,
  CreateRequestForQuotationItemDto,
  RequestForQuotation,
  RequestForQuotationDetailed,
  RequestForQuotationItem,
  RequestForQuotationListItem,
  SupplierQuotation,
  SupplierQuotationItem,
  SupplierQuotationItemOption,
  UpdateRequestForQuotationDto,
} from "@/types/request-for-quotation";

const requestForQuotationsApi = {
  async create({ privateRequest, dto }: { privateRequest: PrivateRequest; dto: CreateRequestForQuotationDto }) {
    return await privateRequest<RequestForQuotation & { items: RequestForQuotationItem[] }>({
      method: "POST",
      url: "request-for-quotations",
      data: dto,
    });
  },

  async list({
    privateRequest,
    params,
    signal,
  }: {
    privateRequest: PrivateRequest;
    params: Dictionary;
    signal: AbortSignal;
  }) {
    return await privateRequest<PaginatedData<RequestForQuotationListItem>>({
      url: "request-for-quotations",
      params,
      signal,
    });
  },

  async get({ privateRequest, id, signal }: { privateRequest: PrivateRequest; id: string; signal?: AbortSignal }) {
    return await privateRequest<RequestForQuotationDetailed>({
      url: `request-for-quotations/${id}`,
      signal,
    });
  },

  async listQuotationItems({
    privateRequest,
    supplierId,
    materialCode,
    signal,
  }: {
    privateRequest: PrivateRequest;
    supplierId: string;
    materialCode?: string;
    signal?: AbortSignal;
  }) {
    return await privateRequest<SupplierQuotationItemOption[]>({
      url: "request-for-quotations/quotation-items",
      params: {
        supplierId,
        ...(materialCode ? { materialCode } : {}),
      },
      signal,
    });
  },

  async updateHeader({
    privateRequest,
    id,
    dto,
  }: {
    privateRequest: PrivateRequest;
    id: string;
    dto: UpdateRequestForQuotationDto;
  }) {
    return await privateRequest<RequestForQuotation>({
      method: "PATCH",
      url: `request-for-quotations/${id}`,
      data: dto,
    });
  },

  async addItem({
    privateRequest,
    id,
    dto,
  }: {
    privateRequest: PrivateRequest;
    id: string;
    dto: CreateRequestForQuotationItemDto;
  }) {
    return await privateRequest<RequestForQuotationItem>({
      method: "POST",
      url: `request-for-quotations/${id}/items`,
      data: dto,
    });
  },

  async deleteItem({
    privateRequest,
    id,
    itemId,
  }: {
    privateRequest: PrivateRequest;
    id: string;
    itemId: string;
  }) {
    return await privateRequest<{ id: string }>({
      method: "DELETE",
      url: `request-for-quotations/${id}/items/${itemId}`,
    });
  },

  async close({ privateRequest, id }: { privateRequest: PrivateRequest; id: string }) {
    return await privateRequest<RequestForQuotation>({
      method: "POST",
      url: `request-for-quotations/${id}/close`,
    });
  },

  async cancel({ privateRequest, id }: { privateRequest: PrivateRequest; id: string }) {
    return await privateRequest<RequestForQuotation>({
      method: "POST",
      url: `request-for-quotations/${id}/cancel`,
    });
  },

  async inviteSupplier({
    privateRequest,
    id,
    supplierId,
  }: {
    privateRequest: PrivateRequest;
    id: string;
    supplierId: string;
  }) {
    return await privateRequest<SupplierQuotation>({
      method: "POST",
      url: `request-for-quotations/${id}/supplier-quotations`,
      data: { supplierId },
    });
  },

  async updateQuotation({
    privateRequest,
    id,
    quotationId,
    dto,
  }: {
    privateRequest: PrivateRequest;
    id: string;
    quotationId: string;
    dto: {
      paymentTerms?: string | null;
      deliveryTerms?: string | null;
      deliveryPeriodDays?: number | null;
      validUntil?: string | null;
      notes?: string | null;
    };
  }) {
    return await privateRequest<SupplierQuotation>({
      method: "PATCH",
      url: `request-for-quotations/${id}/supplier-quotations/${quotationId}`,
      data: dto,
    });
  },

  async addQuotationItem({
    privateRequest,
    id,
    quotationId,
    dto,
  }: {
    privateRequest: PrivateRequest;
    id: string;
    quotationId: string;
    dto: {
      requestForQuotationItemId: string;
      unitOfMeasurementSelected: string;
      unitPrice: number;
      notes: string | null;
    };
  }) {
    return await privateRequest<SupplierQuotationItem>({
      method: "POST",
      url: `request-for-quotations/${id}/supplier-quotations/${quotationId}/items`,
      data: dto,
    });
  },

  async updateQuotationItem({
    privateRequest,
    id,
    quotationId,
    itemId,
    dto,
  }: {
    privateRequest: PrivateRequest;
    id: string;
    quotationId: string;
    itemId: string;
    dto: { unitOfMeasurementSelected?: string; unitPrice?: number; notes?: string | null };
  }) {
    return await privateRequest<SupplierQuotationItem>({
      method: "PATCH",
      url: `request-for-quotations/${id}/supplier-quotations/${quotationId}/items/${itemId}`,
      data: dto,
    });
  },

  async deleteQuotationItem({
    privateRequest,
    id,
    quotationId,
    itemId,
  }: {
    privateRequest: PrivateRequest;
    id: string;
    quotationId: string;
    itemId: string;
  }) {
    return await privateRequest<{ id: string }>({
      method: "DELETE",
      url: `request-for-quotations/${id}/supplier-quotations/${quotationId}/items/${itemId}`,
    });
  },
};

export default requestForQuotationsApi;
