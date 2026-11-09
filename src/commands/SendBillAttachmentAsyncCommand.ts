import {
	ICommandServices,
	ISendBillAttachmentAsyncParams,
	ISoapTemplate,
	ITemplateParams,
} from '../common/interfaces';
import { SendBillAttachmentAsyncTemplate } from '../soap/templates/SendBillAttachmentAsyncTemplate';
import { SEND_BILL_ATTACHMENT_ASYNC_ACTION } from '../common/constants';
import { BaseSoapCommand } from './BaseSoapCommand';

/**
 * Comando para ejecutar la operación SendBillAttachmentAsync de la DIAN.
 * Envía un documento adjunto (AttachedDocument) de forma asíncrona, soportando firma al vuelo
 * (`unsignedAttachedDocumentXml`) o archivo pre-firmado/ZIP en base64 (`contentFile`).
 */
export class SendBillAttachmentAsyncCommand extends BaseSoapCommand<ISendBillAttachmentAsyncParams, any> {
	protected readonly action = SEND_BILL_ATTACHMENT_ASYNC_ACTION;
	protected readonly operationName = 'SendBillAttachmentAsync';

	protected createTemplate(): ISoapTemplate {
		return new SendBillAttachmentAsyncTemplate();
	}

	protected override buildTemplateParams(
		services: ICommandServices,
		params: ISendBillAttachmentAsyncParams,
		endpointUrl: string,
	): ITemplateParams {
		const contentFile = this.resolveDocumentContentBase64({
			contentFile: params.contentFile,
			unsignedXml: params.unsignedAttachedDocumentXml,
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
