import type { DocumentType, IDocumentTypeConfig } from '../ubl/models';
import type { ISignatureAlgorithm } from '../security/BaseXmlSigner';

/**
 * Opciones opcionales de pre-procesamiento UBL y configuración de firma XAdES-EPES.
 * Permite inyectar automáticamente `SoftwareSecurityCode`, `CUFE`/`CUDE`/`CUDS`/`CUNE`
 * y `QRCode` antes de aplicar la firma digital.
 */
export interface IXmlSignOptions {
	softwareID?: string;
	pin?: string;
	technicalKey?: string;
	documentType?: DocumentType;
	algorithm?: ISignatureAlgorithm;
}

/**
 * Define el contrato base para una clase que firma un documento (SOAP o XML UBL).
 * Mantiene compatibilidad hacia atrás con versiones previas del SDK.
 */
export interface ISigner {
	sign(
		unsignedDocument: string | any,
		certificateData: ICertificateData,
		action?: string,
		toValue?: string,
	): string;
}

/**
 * Contrato segregado (ISP) para el firmante WS-Security SOAP 1.2.
 */
export interface ISoapSigner extends ISigner {
	sign(
		unsignedSoap: string | any,
		certificateData: ICertificateData,
		action: string,
		toValue: string,
	): string;
}

/**
 * Contrato segregado (ISP) para firmantes de documentos XML UBL / Nómina bajo XAdES-EPES.
 */
export interface IXmlSigner extends ISigner {
	sign(
		unsignedXml: string | any,
		certificateData: ICertificateData,
		action?: string,
		toValue?: string,
		options?: IXmlSignOptions,
	): string;
	setAlgorithm?(algorithm: ISignatureAlgorithm): void;
	setSigningOptions?(options: IXmlSignOptions): void;
	getDocumentConfig?(): IDocumentTypeConfig | undefined;
}

/**
 * Contrato para la fábrica de firmantes XML (Patrón Factory).
 */
export interface IXmlSignerFactory {
	createForXml(xml: string, explicitType?: DocumentType): IXmlSigner;
	createForDocumentType(type: DocumentType): IXmlSigner;
}

/**
 * Define el contrato para un cliente HTTP.
 */
export interface IHttpClient {
	post(data: any, headers: { [key: string]: string }): Promise<any>;
}

/**
 * Parámetros comunes para todas las plantillas.
 */
export interface ITemplateParams {
	[key: string]: any;
}

/**
 * Contrato para todas las plantillas de mensajes SOAP.
 */
export interface ISoapTemplate {
	getXml(params: ITemplateParams): string;
}

/**
 * Opciones de configuración e inyección de dependencias (DIP) para el cliente DIAN.
 */
export interface IDianClientOptions {
	environment: number; // 1 para PRODUCCION, 2 para HABILITACION
	soapClient?: IHttpClient;
	soapSigner?: ISigner;
	xmlSigner?: ISigner;
	payrollSigner?: ISigner;
	attachedDocumentSigner?: ISigner;
	documentSupportSigner?: ISigner;
	adjustmentNoteSigner?: ISigner;
	signerFactory?: IXmlSignerFactory;
}

/**
 * Define los servicios que un comando necesita para ejecutarse.
 */
export interface ICommandServices {
	soapClient: IHttpClient;
	soapSigner: ISigner;
	xmlSigner: ISigner;
	payrollSigner: ISigner;
	certificateData: ICertificateData;
	environment: number;
	attachedDocumentSigner?: ISigner;
	documentSupportSigner?: ISigner;
	adjustmentNoteSigner?: ISigner;
	signerFactory?: IXmlSignerFactory;
}

/**
 * Define el contrato para un Comando (Patrón Command).
 */
export interface ICommand<TParams, TResult> {
	execute(services: ICommandServices, params: TParams): Promise<TResult>;
}

/**
 * Representa la información extraída de un certificado digital PKCS#12.
 */
export interface ICertificateData {
	privateKeyPem: string;
	publicKeyPem: string;
	x509CertificateBase64: string;
}

/**
 * Opciones para inicializar el certificado digital en DianClient.
 * Soporta tanto `password` como `passwordPsswrd` por compatibilidad hacia atrás.
 */
export interface IDianClientInitializeOptions {
	certificate: Buffer;
	passwordPsswrd?: string;
	password?: string;
}

// --- Parámetros de Comandos ---

export interface ISendBillSyncParams {
	fileName: string;
	/** XML UBL sin firmar (flujo de firma al vuelo). */
	unsignedUblXml?: string;
	/** Archivo XML firmado o ZIP ya codificado en base64 (flujo pre-firmado). */
	contentFile?: string;
	/** Opciones opcionales para inyección previa de CUFE/CUDE/CUDS y SoftwareSecurityCode. */
	signingOptions?: IXmlSignOptions;
}

export interface ISendBillAsyncParams {
	fileName: string;
	/** XML UBL sin firmar (flujo de firma al vuelo). */
	unsignedUblXml?: string;
	/** Archivo XML firmado o ZIP ya codificado en base64 (flujo pre-firmado). */
	contentFile?: string;
	/** Opciones opcionales para inyección previa de CUFE/CUDE/CUDS y SoftwareSecurityCode. */
	signingOptions?: IXmlSignOptions;
}

export interface ISendEventParams {
	/** XML ApplicationResponse sin firmar (flujo de firma al vuelo). */
	unsignedEventXml?: string;
	/** Archivo XML firmado o ZIP ya codificado en base64 (flujo pre-firmado). */
	contentFile?: string;
	/** Opciones opcionales para inyección previa de CUDE-Event y SoftwareSecurityCode. */
	signingOptions?: IXmlSignOptions;
}

export interface ISendNominaSyncParams {
	/** XML de Nómina Individual o de Ajuste sin firmar (flujo de firma al vuelo). */
	unsignedPayrollXml?: string;
	/** Archivo XML firmado o ZIP ya codificado en base64 (flujo pre-firmado). */
	contentFile?: string;
	/** Opciones opcionales para inyección previa de CUNE y SoftwareSC. */
	signingOptions?: IXmlSignOptions;
}

export interface ISendTestSetAsyncParams extends ITemplateParams {
	fileName: string;
	contentFile: string;
	testSetId: string;
}

export interface ISendBillAttachmentAsyncParams {
	fileName: string;
	/** XML AttachedDocument sin firmar (flujo de firma al vuelo). */
	unsignedAttachedDocumentXml?: string;
	/** Archivo XML firmado o ZIP ya codificado en base64 (flujo pre-firmado). */
	contentFile?: string;
	/** Opciones opcionales para configuración de firma. */
	signingOptions?: IXmlSignOptions;
}

export interface IGetStatusCommandParams {
	trackId: string;
}

export interface IGetStatusZipParams {
	trackId: string;
}

export interface IGetStatusEventParams {
	trackId: string;
}

export interface IGetXmlByDocumentKeyParams {
	trackId: string;
}

export interface IGetReferenceNotesParams extends ITemplateParams {
	trackId: string;
}

export interface IGetAcquirerParams extends ITemplateParams {
	identificationType: string;
	identificationNumber: string;
}

export interface IGetNumberingRangeParams extends ITemplateParams {
	accountCode: string;
	accountCodeT: string;
	softwareCode: string;
}

export interface IGetExchangeEmailsParams {
	// No requiere parámetros
}

// --- Parámetros de Templates (uso interno) ---

export interface ISendBillSyncTemplateParams extends ITemplateParams {
	fileName: string;
	contentFile: string;
}

export interface ISendBillAsyncTemplateParams extends ITemplateParams {
	fileName: string;
	contentFile: string;
}

export interface ISendEventTemplateParams extends ITemplateParams {
	contentFile: string;
}

export interface ISendNominaSyncTemplateParams extends ITemplateParams {
	contentFile: string;
}

export interface ISendBillAttachmentAsyncTemplateParams extends ITemplateParams {
	fileName: string;
	contentFile: string;
}
