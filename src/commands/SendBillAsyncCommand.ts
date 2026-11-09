import {
	ICommandServices,
	ISendBillAsyncParams,
	ISoapTemplate,
	ITemplateParams,
} from '../common/interfaces';
import { SendBillAsyncTemplate } from '../soap/templates/SendBillAsyncTemplate';
import { SEND_BILL_ASYNC_ACTION } from '../common/constants';
import { BaseSoapCommand } from './BaseSoapCommand';

/**
 * Comando para ejecutar la operación SendBillAsync de la DIAN.
 * Soporta tanto la firma al vuelo de `unsignedUblXml` como el envío directo de `contentFile` (base64).
 */
export class SendBillAsyncCommand extends BaseSoapCommand<ISendBillAsyncParams, any> {
	protected readonly action = SEND_BILL_ASYNC_ACTION;
	protected readonly operationName = 'SendBillAsync';

	protected createTemplate(): ISoapTemplate {
		return new SendBillAsyncTemplate();
	}

	protected override buildTemplateParams(
		services: ICommandServices,
		params: ISendBillAsyncParams,
		endpointUrl: string,
	): ITemplateParams {
		const contentFile = this.resolveDocumentContentBase64({
			contentFile: params.contentFile,
			unsignedXml: params.unsignedUblXml,
			signingOptions: params.signingOptions,
			signer: services.xmlSigner,
			services,
			endpointUrl,
		});

		return {
			fileName: params.fileName,
			contentFile,
		};
	}
}
