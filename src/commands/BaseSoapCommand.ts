import {
	ICommand,
	ICommandServices,
	ISigner,
	ISoapTemplate,
	ITemplateParams,
	IXmlSignOptions,
} from '../common/interfaces';
import { fastXmlParser } from '../common/utils';
import { DianEndpoints } from '../config/dianEndpoints';

export interface IDocumentContentResolutionInput {
	contentFile?: string;
	unsignedXml?: string;
	signingOptions?: IXmlSignOptions;
	signer: ISigner;
	services: ICommandServices;
	endpointUrl: string;
}

/**
 * Clase base abstracta para todos los comandos SOAP de la DIAN.
 * Aplica los patrones Command y Template Method (SOLID / DRY) para encapsular el flujo
 * común de construcción de plantilla SOAP, firma WS-Security, envío HTTP y extracción
 * de resultados del nodo `<{Operation}Response><{Operation}Result>`.
 */
export abstract class BaseSoapCommand<TParams, TResult = any> implements ICommand<TParams, TResult> {
	protected abstract readonly action: string;
	protected abstract readonly operationName: string;

	protected abstract createTemplate(): ISoapTemplate;

	/**
	 * Hook que construye los parámetros para la plantilla SOAP.
	 * Los comandos de envío sobreescriben este método para firmar el XML (si no viene en `contentFile`)
	 * y codificarlo en base64.
	 */
	protected buildTemplateParams(
		_services: ICommandServices,
		params: TParams,
		_endpointUrl: string,
	): ITemplateParams {
		return (params ?? {}) as ITemplateParams;
	}

	/**
	 * Template Method principal que ejecuta el ciclo completo del comando SOAP.
	 */
	public async execute(services: ICommandServices, params: TParams): Promise<TResult> {
		const endpointUrl = this.resolveEndpointUrl(services.environment);
		const templateParams = this.buildTemplateParams(services, params, endpointUrl);
		const template = this.createTemplate();
		const unsignedSoap = template.getXml(templateParams);
		const signedSoap = services.soapSigner.sign(
			unsignedSoap,
			services.certificateData,
			this.action,
			endpointUrl,
		);

		const responseXml = await services.soapClient.post(signedSoap, {
			action: this.action,
		});

		return this.extractResult(responseXml);
	}

	/**
	 * Resuelve la URL del endpoint DIAN para el ambiente configurado, con fallback seguro
	 * al endpoint de producción (`DianEndpoints[1]`) como en `ubl21dian` v3.6.8.
	 */
	protected resolveEndpointUrl(environment: number): string {
		return DianEndpoints[environment] || DianEndpoints[1];
	}

	/**
	 * Resuelve el contenido en base64 (`contentFile`) soportando flujo dual:
	 * 1. Si se provee `contentFile` (XML ya firmado o ZIP en base64), lo retorna directamente.
	 * 2. Si se provee `unsignedXml`, aplica las opciones de firma XAdES-EPES y codifica en base64.
	 */
	protected resolveDocumentContentBase64(input: IDocumentContentResolutionInput): string {
		if (input.contentFile) {
			return input.contentFile;
		}

		if (input.unsignedXml === undefined) {
			throw new Error(
				`[${this.operationName}] Debe proporcionar 'contentFile' (base64) o el documento XML sin firmar.`,
			);
		}

		if (input.signingOptions && typeof (input.signer as any).setSigningOptions === 'function') {
			(input.signer as any).setSigningOptions(input.signingOptions);
		}

		const signedXml = input.signer.sign(
			input.unsignedXml,
			input.services.certificateData,
			this.action,
			input.endpointUrl,
		);
		return Buffer.from(signedXml).toString('base64');
	}

	/**
	 * Extrae el nodo de resultado SOAP `<Envelope><Body><{Operation}Response><{Operation}Result>`.
	 */
	protected extractResult(responseXml: string): TResult {
		const parsedResponse = fastXmlParser.parse(responseXml);
		const responseKey = `${this.operationName}Response`;
		const resultKey = `${this.operationName}Result`;
		return parsedResponse?.['Envelope']?.['Body']?.[responseKey]?.[resultKey] as TResult;
	}
}
