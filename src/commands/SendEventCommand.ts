import {
	ICommandServices,
	ISendEventParams,
	ISoapTemplate,
	ITemplateParams,
} from '../common/interfaces';
import { SendEventTemplate } from '../soap/templates/SendEventTemplate';
import { SEND_EVENT_UPDATE_STATUS_ACTION } from '../common/constants';
import { BaseSoapCommand } from './BaseSoapCommand';

/**
 * Comando para ejecutar la operación SendEventUpdateStatus de la DIAN.
 * Soporta tanto la firma al vuelo de `unsignedEventXml` como el envío directo de `contentFile` (base64).
 */
export class SendEventCommand extends BaseSoapCommand<ISendEventParams, any> {
	protected readonly action = SEND_EVENT_UPDATE_STATUS_ACTION;
	protected readonly operationName = 'SendEventUpdateStatus';

	protected createTemplate(): ISoapTemplate {
		return new SendEventTemplate();
	}

	protected override buildTemplateParams(
		services: ICommandServices,
		params: ISendEventParams,
		endpointUrl: string,
	): ITemplateParams {
		const contentFile = this.resolveDocumentContentBase64({
			contentFile: params.contentFile,
			unsignedXml: params.unsignedEventXml,
			signingOptions: params.signingOptions,
			signer: services.xmlSigner,
			services,
			endpointUrl,
		});

		return {
			contentFile,
		};
	}
}
