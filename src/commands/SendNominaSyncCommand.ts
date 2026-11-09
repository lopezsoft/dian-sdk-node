import {
	ICommandServices,
	ISendNominaSyncParams,
	ISoapTemplate,
	ITemplateParams,
} from '../common/interfaces';
import { SendNominaSyncTemplate } from '../soap/templates/SendNominaSyncTemplate';
import { SEND_NOMINA_SYNC_ACTION } from '../common/constants';
import { BaseSoapCommand } from './BaseSoapCommand';

/**
 * Comando para ejecutar la operación SendNominaSync de la DIAN.
 * Soporta tanto la firma al vuelo de `unsignedPayrollXml` con `payrollSigner`
 * como el envío directo de `contentFile` (base64).
 */
export class SendNominaSyncCommand extends BaseSoapCommand<ISendNominaSyncParams, any> {
	protected readonly action = SEND_NOMINA_SYNC_ACTION;
	protected readonly operationName = 'SendNominaSync';

	protected createTemplate(): ISoapTemplate {
		return new SendNominaSyncTemplate();
	}

	protected override buildTemplateParams(
		services: ICommandServices,
		params: ISendNominaSyncParams,
		endpointUrl: string,
	): ITemplateParams {
		const contentFile = this.resolveDocumentContentBase64({
			contentFile: params.contentFile,
			unsignedXml: params.unsignedPayrollXml,
			signingOptions: params.signingOptions,
			signer: services.payrollSigner,
			services,
			endpointUrl,
		});

		return {
			contentFile,
		};
	}
}
