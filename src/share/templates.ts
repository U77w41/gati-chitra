export interface TemplateInfo {
  id: string;
  title: string;
  file: string;
}

export const FOOD_DELIVERY_PIPELINE_TEMPLATE = `flowchart TD
  title[Food Delivery Pipeline — From tap to doorstep]
  order["Order Placed\\nCustomer App Request"] --> auth["Payment Auth\\nStripe Gateway Sync"]
  auth --> checkPay{"Payment\\nAuthorized?"}
  checkPay -->|Declined| declined["Payment Declined\\nTransaction Failed"]
  checkPay -->|Pre-Dispatch| dispatch["Courier Dispatch\\nProximity Matching"]
  checkPay -->|Success| kitchen["Kitchen Preparation\\nRestaurant Processing"]
  dispatch --> assigned{"Courier\\nAssigned?"}
  assigned -->|Found| kitchen
  assigned -->|Timeout| fail["Dispatch Failure\\nNo Courier Found"]
  kitchen --> onTime{"Prepared\\non Time?"}
  onTime -->|Issue| cancelled["Order Cancelled\\nItem Out of Stock"]
  onTime -->|En Route| delivered["Order Delivered\\nCustomer Handover"]
`;

export const APPROVAL_WORKFLOW_TEMPLATE = `flowchart LR
  title[Approval Workflow — Automated Pipeline]
  trigger["Form Submission\\nCustomer Intake"] --> doc["Generate Document\\nTemplate Engine"]
  doc --> approval["Manager Approval\\nSlack Notification"]
  approval --> cond{"Approved?"}
  cond -->|true| sign["Send for Signature\\nDigital Sign"]
  cond -->|false| rejectNotify["Notify Submitter\\nRejection Notice"]
  sign --> updateSheet["Update Records\\nDatabase Log"]
  updateSheet --> notifyAll["Broadcast Completion\\nChannel Alert"]
`;

export const BUILTIN_TEMPLATES: Record<string, string> = {
  'food-delivery': FOOD_DELIVERY_PIPELINE_TEMPLATE,
  'approval-workflow': APPROVAL_WORKFLOW_TEMPLATE,
};

export function templateUrl(baseUrl: string, file: string): string {
  const base = baseUrl.replace(/\/+$/, '');
  const cleanFile = file.replace(/^\/+/, '');
  return `${base}/templates/${cleanFile}`;
}

export async function loadTemplateIndex(
  baseUrl: string,
  fetchFn: typeof fetch = fetch,
): Promise<TemplateInfo[]> {
  try {
    const url = templateUrl(baseUrl, 'index.json');
    const res = await fetchFn(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data;
  } catch {
    return [];
  }
}

export async function loadTemplate(
  baseUrl: string,
  info: TemplateInfo,
  fetchFn: typeof fetch = fetch,
): Promise<string | null> {
  try {
    const url = templateUrl(baseUrl, info.file);
    const res = await fetchFn(url);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}
