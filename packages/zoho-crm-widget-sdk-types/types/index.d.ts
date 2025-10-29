// Type definitions for Zoho CRM Widget SDK v1.5
// Project: https://github.com/zoho/embeddedApp-js-sdkx`x`
// License: Apache-2.0

/** Common embedded app event names (extendable) */
export type EmbeddedAppEventName =  
  | 'PageLoad'
  | 'Init'
  | 'Dial'
  | 'DialerActive'
  | 'Notify'
  | 'NotifyAndWait'
  | 'ContextUpdate';

/** Embedded App event handler signature */
export type EmbeddedAppEventHandler<T = any> = (data: T) => void | Promise<void>;

// -----------------------------------------------------------
// ZOHO Namespace Root
// -----------------------------------------------------------

export interface ZohoEmbeddedApp {
  /** Register an event listener (e.g., 'PageLoad', 'Parent', etc.) */
  on(event: EmbeddedAppEventName, handler: EmbeddedAppEventHandler): void;
  /** Register an event listener for any custom / future event */
  on(event: string, handler: EmbeddedAppEventHandler): void;
  /** Initialize the widget environment. Resolves with context or void depending on runtime */
  init(): Promise<any>;
}

// -----------------------------------------------------------
// CRM Core Helpers (High level wrappers) - Minimal surface
// -----------------------------------------------------------

export interface CRMFunctionsNamespace {
  /** Invoke a custom function */
  execute(funcName: string, reqData: { arguments?: string; [k: string]: any }): Promise<any>;
}

export interface CRMEventsNamespace {
  /** Dispatch / broadcast a CRM event */
  dispatch(eventName: string, eventData?: any): Promise<any>;
}

export interface CRMConfigNamespace {
  /** Plugin organization scope information */
  getOrgInfo(): Promise<any>;
  /** Current user info */
  getCurrentUser(): Promise<ZohoCurrentUser>;
  /** Environment (DC, ZUID, etc.) */
  GetCurrentEnvironment(): Promise<any>;
  /** User preference (dark mode, etc.) */
  getUserPreference(): Promise<{ mode?: string; [k: string]: any }>;
}

export interface ZohoCurrentUserRole { id: string; name: string; }
export interface ZohoCurrentUserProfile { id: string; name: string; }
export interface ZohoCurrentUser {
  id: string;
  full_name?: string;
  first_name?: string | null;
  last_name?: string;
  email?: string;
  role?: ZohoCurrentUserRole;
  profile?: ZohoCurrentUserProfile;
  [k: string]: any;
}

export interface CRMMetaNamespace {
  /** Get field metadata for an entity */
  getFields(config: { Entity: string; [k: string]: any }): Promise<{ fields: ZohoFieldMeta[] } | any>;
  /** Get modules list */
  getModules?(config?: any): Promise<any>;
  /** Get layouts */
  getLayouts?(config: any): Promise<any>;
  /** Get related lists */
  getRelatedList?(config: any): Promise<any>;
  /** Get custom views */
  getCustomViews?(config: any): Promise<any>;
}

export interface ZohoFieldMetaPickListValue { display_value: string; actual_value: string; }
export interface ZohoFieldMeta {
  id: string;
  api_name: string;
  field_label: string;
  data_type?: string;
  length?: number;
  read_only?: boolean;
  pick_list_values?: ZohoFieldMetaPickListValue[];
  [k: string]: any;
}

export interface CRMUINamespace {
  /** Resize current widget */
  Resize?(config: { height?: string | number; width?: string | number }): Promise<any>;
  /** Record interactions */
  Record?: {
    open?(config: { Entity: string; RecordID: string }): Promise<any>;
    edit?(config: { Entity: string; RecordID: string }): Promise<any>;
    create?(config: { Entity: string; data?: any }): Promise<any>;
    populate?(recordData: any): Promise<any>;
  };
  Popup?: {
    close?(): void;
    closeReload?(): void;
  };
  Widget?: {
    open?(config: { name?: string; url?: string; params?: Record<string,string>; [k: string]: any }): Promise<any>;
  };
  Dialer?: {
    maximize?(): Promise<any>;
    minimize?(): Promise<any>;
    notify?(data?: any): Promise<any>;
  };
}

export interface CRMHTTPNamespace {
  get<T=any>(data: any): Promise<T>;
  post<T=any>(data: any): Promise<T>;
  put<T=any>(data: any): Promise<T>;
  patch<T=any>(data: any): Promise<T>;
  delete<T=any>(data: any): Promise<T>;
}

export interface CRMConnectorNamespace {
  invokeAPI(nameSpace: string, data: any): Promise<any>;
  authorize(nameSpace: string): Promise<any>;
}

export interface CRMConnectionNamespace {
  invoke(connectionName: string, reqData: any): Promise<any>;
}

export interface CRMWizardNamespace { post(data: any): Promise<any>; }
export interface CRMBlueprintNamespace { proceed(data?: any): Promise<any>; }

export interface CRMActionNamespace {
  setConfig(obj: any): Promise<any>;
  enableAccountAccess(obj: any): Promise<any>;
}

export interface CRMAPINamespace {
  addNotes?(data: any): Promise<any>;
  addNotesAttachment?(data: any): Promise<any>;
  coql?(data: any): Promise<any>;
  insertRecord?(data: { Entity?: string; data?: any; [k: string]: any }): Promise<any>;
  upsertRecord?(data: any): Promise<any>;
  getRecord?(data: any): Promise<any>;
  getBluePrint?(data: any): Promise<any>;
  updateBluePrint?(data: any): Promise<any>;
  uploadFile?(data: { FILE?: File | Blob; [k: string]: any }): Promise<any>;
  getFile?(data: any): Promise<any>;
  getAllRecords?(data: any): Promise<any>;
  updateRecord?(data: any): Promise<any>;
  deleteRecord?(data: any): Promise<any>;
  searchRecord?(data: any): Promise<any>;
  getAllActions?(data: any): Promise<any>;
  getApprovalRecords?(data: any): Promise<any>;
  getApprovalById?(data: any): Promise<any>;
  getApprovalsHistory?(): Promise<any>;
  approveRecord?(data: any): Promise<any>;
  getAllUsers?(data: any): Promise<any>;
  getUser?(data: any): Promise<any>;
  getRelatedRecords?(data: any): Promise<any>;
  updateRelatedRecords?(data: any): Promise<any>;
  delinkRelatedRecord?(data: any): Promise<any>;
  attachFile?(data: any): Promise<any>;
  getAllProfiles?(data: any): Promise<any>;
  getProfile?(data: any): Promise<any>;
  updateProfile?(data: any): Promise<any>;
  getOrgVariable?(nameSpace: string): Promise<any>;
}

export interface ZOHOCRMNamespace {
  /** Low level ACTION APIs */
  ACTION: CRMActionNamespace;
  /** Invoke custom functions */
  FUNCTIONS: CRMFunctionsNamespace;
  /** Event dispatch */
  EVENTS: CRMEventsNamespace;
  /** Configuration & user info */
  CONFIG: CRMConfigNamespace;
  /** Meta information */
  META: CRMMetaNamespace;
  /** Record / file / etc API */
  API: CRMAPINamespace;
  /** UI helpers */
  UI: CRMUINamespace;
  /** Raw HTTP (server side) */
  HTTP: CRMHTTPNamespace;
  /** Connector helper */
  CONNECTOR: CRMConnectorNamespace;
  /** Connection helper */
  CONNECTION: CRMConnectionNamespace;
  /** Wizard helper */
  WIZARD: CRMWizardNamespace;
  /** Blueprint helper */
  BLUEPRINT: CRMBlueprintNamespace;
}

export interface ZOHONamespace {
  embeddedApp: ZohoEmbeddedApp;
  CRM: ZOHOCRMNamespace;
  /** SDK version available at runtime (optional) */
  __SDK_VERSION__?: '1.5' | string;
  /** Additional namespaces (e.g., ZDK) may be present at runtime */
  [k: string]: any;
}

// -----------------------------------------------------------
// zrc HTTP Helper (Public surface inferred from code)
// -----------------------------------------------------------

export type AllowedResponseType = "json" | "text" | "blob" | "arraybuffer"; // stream unsupported v1.5

export interface ZrcRequestConfig {
  headers?: Record<string, string>;
  connection?: string;
  responseType?: AllowedResponseType;
  baseUrl?: string;
  params?: Record<string, string | number | boolean>;
  signal?: AbortSignal;
  mode?: 'cors' | 'no-cors' | 'same-origin';
  cache?: 'default' | 'no-store' | 'reload' | 'no-cache' | 'force-cache' | 'only-if-cached';
  referrerPolicy?: 'no-referrer' | 'client' | 'no-referrer-when-downgrade' | 'origin' | 'origin-when-cross-origin' | 'same-origin' | 'strict-origin' | 'strict-origin-when-cross-origin' | 'unsafe-url';
}

export interface ZrcGenericRequestConfig extends ZrcRequestConfig {
  body?: any;
  method: string;
  path?: string;
}

export interface ZrcResponse<T = any> {
  status?: number;
  headers?: Record<string, string> | Headers;
  data?: T;
}

export interface ZRC {
  get<T = any>(path: string, requestConfig?: ZrcRequestConfig): Promise<ZrcResponse<T>>;
  post<T = any>(path: string, body?: any, requestConfig?: ZrcRequestConfig): Promise<ZrcResponse<T>>;
  put<T = any>(path: string, body?: any, requestConfig?: ZrcRequestConfig): Promise<ZrcResponse<T>>;
  patch<T = any>(path: string, body?: any, requestConfig?: ZrcRequestConfig): Promise<ZrcResponse<T>>;
  delete<T = any>(path: string, requestConfig?: ZrcRequestConfig): Promise<ZrcResponse<T>>;
  options<T = any>(path: string, requestConfig?: ZrcRequestConfig): Promise<ZrcResponse<T>>;
  head<T = any>(path: string, requestConfig?: ZrcRequestConfig): Promise<ZrcResponse<T>>;
  request<T = any>(config: ZrcGenericRequestConfig): Promise<ZrcResponse<T>>;
  createInstance(config?: ZrcRequestConfig): CustomZrc;
}

export interface CustomZrc extends Omit<ZRC, 'createInstance'> {}

export declare const zrc: ZRC;

// -----------------------------------------------------------
// Errors
// -----------------------------------------------------------

export class ZrcValidationError extends Error {}
export class ZrcError extends Error {}
export class ApiError extends Error {}
export class ConnectionError extends Error {}

// -----------------------------------------------------------
// Globals
// -----------------------------------------------------------

/** Backwards compatibility alias (if any future expansion) */
export type Zoho = ZOHONamespace;

// Ambient globals - provided at runtime by the Zoho widget container.
declare global {
  const ZOHO: ZOHONamespace;
  const zrc: ZRC;
}

// Ensure this file is treated as a module while only providing ambient globals.
export {};
