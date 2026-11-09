export { DianClient } from './DianClient';

// Common — Interfaces y utilidades públicas
export { hexToDecimal, formatColombiaSigningTime } from './common/utils';
export type {
	ISigner,
	ISoapSigner,
	IXmlSigner,
	IXmlSignOptions,
	IXmlSignerFactory,
	IHttpClient,
	ITemplateParams,
	ISoapTemplate,
	IDianClientOptions,
	ICommandServices,
	ICommand,
	ICertificateData,
	IDianClientInitializeOptions,
	ISendBillSyncParams,
	ISendBillAsyncParams,
	ISendEventParams,
	ISendNominaSyncParams,
	ISendTestSetAsyncParams,
	ISendBillAttachmentAsyncParams,
	IGetStatusCommandParams,
	IGetStatusZipParams,
	IGetStatusEventParams,
	IGetXmlByDocumentKeyParams,
	IGetReferenceNotesParams,
	IGetAcquirerParams,
	IGetNumberingRangeParams,
	IGetExchangeEmailsParams,
} from './common/interfaces';

// UBL — Modelos y extensiones DIAN
export { DocumentType, DOCUMENT_TYPE_CONFIG, detectDocumentType, detectDocumentTypeFromDom } from './ubl/models';
export type { IDocumentTypeConfig } from './ubl/models';
export {
	truncateDecimals,
	softwareSecurityCode,
	calculateCufe,
	calculateCude,
	calculateCuds,
	calculateCune,
	calculateCudeEvent,
	injectUuid,
	injectCune,
	injectCudeEvent,
	injectSoftwareSecurityCode,
	injectPayrollSoftwareSecurityCode,
	getQRDataInvoice,
	getQRDataDocumentSupport,
	getQRDataPayroll,
	applyPreSignUblExtensions,
} from './ubl/DianExtensions';
export type { IUuidInjectionOptions } from './ubl/DianExtensions';

// Security
export { BaseXmlSigner, ALGO_SHA1, ALGO_SHA256, ALGO_SHA512 } from './security/BaseXmlSigner';
export type { ISignatureAlgorithm } from './security/BaseXmlSigner';
export { XmlSigner } from './security/XmlSigner';
export { PayrollSigner } from './security/PayrollSigner';
export { AttachedDocumentSigner } from './security/AttachedDocumentSigner';
export { DocumentSupportSigner } from './security/DocumentSupportSigner';
export { AdjustmentNoteSigner } from './security/AdjustmentNoteSigner';
export { XmlSignerFactory } from './security/XmlSignerFactory';
export { SoapSigner } from './security/SoapSigner';
export { Certificate } from './security/Certificate';

// HTTP
export { SoapClient } from './http/SoapClient';

// Commands
export * from './commands';
