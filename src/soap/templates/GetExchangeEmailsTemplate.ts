import { BaseTemplate } from './BaseTemplate';

/**
 * Plantilla para la acción GetExchangeEmails del web service de la DIAN.
 * Esta acción no requiere parámetros en el cuerpo del SOAP.
 */
export class GetExchangeEmailsTemplate extends BaseTemplate {
	public getXml(): string {
		return this.wrapEnvelope('<wcf:GetExchangeEmails/>');
	}
}
