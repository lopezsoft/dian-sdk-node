import { IGetAcquirerParams, ISoapTemplate } from '../common/interfaces';
import { GetAcquirerTemplate } from '../soap/templates/GetAcquirerTemplate';
import { GET_ACQUIRER_ACTION } from '../common/constants';
import { BaseSoapCommand } from './BaseSoapCommand';

/**
 * Comando para ejecutar la operación GetAcquirer de la DIAN.
 */
export class GetAcquirerCommand extends BaseSoapCommand<IGetAcquirerParams, any> {
	protected readonly action = GET_ACQUIRER_ACTION;
	protected readonly operationName = 'GetAcquirer';

	protected createTemplate(): ISoapTemplate {
		return new GetAcquirerTemplate();
	}
}
