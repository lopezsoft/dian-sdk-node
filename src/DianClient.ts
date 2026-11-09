import { Certificate } from './security/Certificate';
import { SoapClient } from './http/SoapClient';
import { SoapSigner } from './security/SoapSigner';
import { XmlSigner } from './security/XmlSigner';
import { PayrollSigner } from './security/PayrollSigner';
import { AttachedDocumentSigner } from './security/AttachedDocumentSigner';
import { DocumentSupportSigner } from './security/DocumentSupportSigner';
import { AdjustmentNoteSigner } from './security/AdjustmentNoteSigner';
import { XmlSignerFactory } from './security/XmlSignerFactory';
import {
	ICertificateData,
	ICommand,
	ICommandServices,
	IDianClientInitializeOptions,
	IDianClientOptions,
	ISigner,
} from './common/interfaces';

/**
 * FACADE: Punto de entrada principal a la librería.
 * Proporciona una interfaz simple para un subsistema complejo (firma XAdES-EPES, WS-Security SOAP, etc.)
 * y soporta Inyección de Dependencias (DIP) a través de `IDianClientOptions`.
 */
export class DianClient {
	private readonly services: ICommandServices;
	private isInitialized = false;

	constructor(public options: IDianClientOptions) {
		this.services = {
			soapClient: options.soapClient ?? new SoapClient(options.environment),
			soapSigner: options.soapSigner ?? (new SoapSigner() as ISigner),
			xmlSigner: options.xmlSigner ?? (new XmlSigner() as ISigner),
			payrollSigner: options.payrollSigner ?? (new PayrollSigner() as ISigner),
			attachedDocumentSigner: options.attachedDocumentSigner ?? (new AttachedDocumentSigner() as ISigner),
			documentSupportSigner: options.documentSupportSigner ?? (new DocumentSupportSigner() as ISigner),
			adjustmentNoteSigner: options.adjustmentNoteSigner ?? (new AdjustmentNoteSigner() as ISigner),
			signerFactory: options.signerFactory ?? new XmlSignerFactory(),
			certificateData: {} as ICertificateData,
			environment: options.environment,
		};
	}

	/**
	 * Carga el certificado digital PKCS#12 y prepara el cliente para su uso.
	 * Acepta tanto `password` como `passwordPsswrd` por compatibilidad hacia atrás.
	 */
	public async initialize(options: IDianClientInitializeOptions): Promise<void> {
		const password = options.password ?? options.passwordPsswrd ?? '';
		const certificateHandler = new Certificate();
		this.services.certificateData = await certificateHandler.loadFromBuffer(
			options.certificate,
			password,
		);
		this.isInitialized = true;
	}

	/**
	 * Ejecuta un comando para interactuar con la DIAN.
	 * @param command La instancia del comando a ejecutar (p. ej. new GetStatusCommand()).
	 * @param params Los parámetros para ese comando.
	 * @returns El resultado de la ejecución del comando.
	 */
	public async execute<TParams, TResult>(
		command: ICommand<TParams, TResult>,
		params: TParams,
	): Promise<TResult> {
		if (!this.isInitialized) {
			throw new Error('El cliente no ha sido inicializado. Llama a initialize() primero.');
		}
		return command.execute(this.services, params);
	}
}
