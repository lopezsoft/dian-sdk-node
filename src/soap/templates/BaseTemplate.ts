import { ISoapTemplate, ITemplateParams } from '../../common/interfaces';

/**
 * Clase base abstracta para las plantillas SOAP 1.2 de la DIAN.
 */
export abstract class BaseTemplate implements ISoapTemplate {
	public abstract getXml(params?: ITemplateParams): string;

	/**
	 * Envuelve el nodo de operación WCF dentro de un sobre SOAP 1.2 estándar con `<soap:Header/>`.
	 */
	protected wrapEnvelope(bodyContent: string): string {
		return `<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:wcf="http://wcf.dian.colombia">
	<soap:Header/>
	<soap:Body>
		${bodyContent}
	</soap:Body>
</soap:Envelope>`;
	}
}
