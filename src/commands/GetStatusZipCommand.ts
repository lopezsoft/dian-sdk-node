import { IGetStatusZipParams, ISoapTemplate } from '../common/interfaces';
import { GetStatusZipTemplate } from '../soap/templates/GetStatusZipTemplate';
import { GET_STATUS_ZIP_ACTION } from '../common/constants';
import { BaseSoapCommand } from './BaseSoapCommand';

/**
 * Comando para ejecutar la operación GetStatusZip de la DIAN.
 */
export class GetStatusZipCommand extends BaseSoapCommand<IGetStatusZipParams, any> {
	protected readonly action = GET_STATUS_ZIP_ACTION;
	protected readonly operationName = 'GetStatusZip';

	protected createTemplate(): ISoapTemplate {
		return new GetStatusZipTemplate();
	}
}
