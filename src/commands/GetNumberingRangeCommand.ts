import { IGetNumberingRangeParams, ISoapTemplate } from '../common/interfaces';
import { GetNumberingRangeTemplate } from '../soap/templates/GetNumberingRangeTemplate';
import { GET_NUMBERING_RANGE_ACTION } from '../common/constants';
import { BaseSoapCommand } from './BaseSoapCommand';

/**
 * Comando para ejecutar la operación GetNumberingRange de la DIAN.
 */
export class GetNumberingRangeCommand extends BaseSoapCommand<IGetNumberingRangeParams, any> {
	protected readonly action = GET_NUMBERING_RANGE_ACTION;
	protected readonly operationName = 'GetNumberingRange';

	protected createTemplate(): ISoapTemplate {
		return new GetNumberingRangeTemplate();
	}
}
