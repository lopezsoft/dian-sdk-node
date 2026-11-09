import {
	ICommandServices,
	ISendBillSyncParams,
	ISoapTemplate,
	ITemplateParams,
} from '../common/interfaces';
import { SendBillSyncTemplate } from '../soap/templates/SendBillSyncTemplate';
import { SEND_BILL_SYNC_ACTION } from '../common/constants';
import { BaseSoapCommand } from './BaseSoapCommand';

/**
 * Comando para ejecutar la operación SendBillSync de la DIAN.
 * Soporta tanto la firma al vuelo de `unsignedUblXml` como el envío directo de `contentFile` (base64).
 */
export class SendBillSyncCommand extends BaseSoapCommand<ISendBillSyncParams, any> {
	protected readonly action = SEND_BILL_SYNC_ACTION;
	protected readonly operationName = 'SendBillSync';

	protected createTemplate(): ISoapTemplate {
		return new SendBillSyncTemplate();
	}

	protected override buildTemplateParams(
		services: ICommandServices,
		params: ISendBillSyncParams,
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
