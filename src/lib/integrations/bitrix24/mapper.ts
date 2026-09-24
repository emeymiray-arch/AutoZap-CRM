/**
 * Bitrix24 export adapter — maps AutoZap entities to flat rows
 * convenient for CRM import / future REST sync.
 * Core domain stays Bitrix-agnostic; ExternalIdMap stores ID pairs later.
 */

export type BitrixCompanyRow = {
  TITLE: string;
  INN?: string;
  PHONE?: string;
  EMAIL?: string;
  WEB?: string;
  ADDRESS_CITY?: string;
  ADDRESS_REGION?: string;
  COMMENTS?: string;
  UF_AUTOZAP_ID: string;
};

export type BitrixContactRow = {
  NAME: string;
  LAST_NAME?: string;
  POST?: string;
  PHONE?: string;
  EMAIL?: string;
  COMMENTS?: string;
  UF_AUTOZAP_ID: string;
  UF_COMPANY_AUTOZAP_ID?: string;
};

export type BitrixLeadRow = {
  TITLE: string;
  STATUS_ID: string;
  SOURCE_ID?: string;
  PHONE?: string;
  EMAIL?: string;
  COMMENTS?: string;
  UF_AUTOZAP_ID: string;
  UF_COMPANY_AUTOZAP_ID?: string;
};

export type BitrixDealRow = {
  TITLE: string;
  STAGE_ID: string;
  OPPORTUNITY?: number;
  COMMENTS?: string;
  UF_AUTOZAP_ID: string;
  UF_COMPANY_AUTOZAP_ID?: string;
};

const LEAD_STATUS_TO_BITRIX: Record<string, string> = {
  NEW: "NEW",
  IN_PROGRESS: "IN_PROCESS",
  NO_ANSWER: "IN_PROCESS",
  CONTACTED: "IN_PROCESS",
  QUALIFIED: "IN_PROCESS",
  PROPOSAL_SENT: "IN_PROCESS",
  NEGOTIATION: "IN_PROCESS",
  AGREED: "IN_PROCESS",
  REGISTRATION: "IN_PROCESS",
  CONVERTED: "CONVERTED",
  REJECTED: "JUNK",
  NOT_SUITABLE: "JUNK",
  DEFERRED: "PENDING",
};

const DEAL_STAGE_TO_BITRIX: Record<string, string> = {
  NEW: "NEW",
  CONTACT: "PREPARATION",
  PROPOSAL: "PREPAYMENT_INVOICE",
  NEGOTIATION: "EXECUTING",
  APPROVAL: "FINAL_INVOICE",
  REGISTRATION: "EXECUTING",
  LAUNCH: "EXECUTING",
  WON: "WON",
  LOST: "LOSE",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapCompanyToBitrix(c: any): BitrixCompanyRow {
  return {
    TITLE: c.name,
    INN: c.inn || undefined,
    PHONE: c.phone || undefined,
    EMAIL: c.email || undefined,
    WEB: c.website || undefined,
    ADDRESS_CITY: c.city || undefined,
    ADDRESS_REGION: c.region || undefined,
    COMMENTS: c.notes || undefined,
    UF_AUTOZAP_ID: c.id,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapContactToBitrix(c: any): BitrixContactRow {
  return {
    NAME: c.firstName,
    LAST_NAME: c.lastName || undefined,
    POST: c.position || undefined,
    PHONE: c.phone || undefined,
    EMAIL: c.email || undefined,
    COMMENTS: c.comment || undefined,
    UF_AUTOZAP_ID: c.id,
    UF_COMPANY_AUTOZAP_ID: c.companyId || undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapLeadToBitrix(l: any): BitrixLeadRow {
  return {
    TITLE: l.title,
    STATUS_ID: LEAD_STATUS_TO_BITRIX[l.status] || "NEW",
    SOURCE_ID: l.source || undefined,
    PHONE: l.phone || undefined,
    EMAIL: l.email || undefined,
    COMMENTS: l.comment || undefined,
    UF_AUTOZAP_ID: l.id,
    UF_COMPANY_AUTOZAP_ID: l.companyId || undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapDealToBitrix(d: any): BitrixDealRow {
  return {
    TITLE: d.title,
    STAGE_ID: DEAL_STAGE_TO_BITRIX[d.stage] || "NEW",
    OPPORTUNITY: d.amount ?? undefined,
    COMMENTS: d.comment || undefined,
    UF_AUTOZAP_ID: d.id,
    UF_COMPANY_AUTOZAP_ID: d.companyId || undefined,
  };
}

/**
 * TODO: Future Bitrix24 REST client
 * - OAuth / webhook auth
 * - crm.company.add / update
 * - crm.contact.add / update
 * - crm.lead.add / update
 * - crm.deal.add / update
 * - upsert via ExternalIdMap
 */
export const BITRIX24_INTEGRATION_TODO =
  "Модуль готов к подключению REST API. Экспорт Bitrix24 уже формирует UF_AUTOZAP_ID для сопоставления.";
