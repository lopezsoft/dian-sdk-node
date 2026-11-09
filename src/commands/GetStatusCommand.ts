import { IGetStatusCommandParams, ISoapTemplate } from '../common/interfaces';
import { GetStatusTemplate } from '../soap/templates/GetStatusTemplate';
import { GET_STATUS_ACTION } from '../common/constants';
import { BaseSoapCommand } from './BaseSoapCommand';

/**
 * Comando para ejecutar la operación GetStatus de la DIAN.
 */
export class GetStatusCommand extends BaseSoapCommand<IGetStatusCommandParams, any> {
	protected readonly action = GET_STATUS_ACTION;
	protected readonly operationName = 'GetStatus';

	protected createTemplate(): ISoapTemplate {
		return new GetStatusTemplate();
	}
}
