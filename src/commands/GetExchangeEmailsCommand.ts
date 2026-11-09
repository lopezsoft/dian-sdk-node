import { IGetExchangeEmailsParams, ISoapTemplate } from '../common/interfaces';
import { GetExchangeEmailsTemplate } from '../soap/templates/GetExchangeEmailsTemplate';
import { GET_EXCHANGE_EMAILS_ACTION } from '../common/constants';
import { BaseSoapCommand } from './BaseSoapCommand';

/**
 * Comando para ejecutar la operación GetExchangeEmails de la DIAN.
 */
export class GetExchangeEmailsCommand extends BaseSoapCommand<IGetExchangeEmailsParams, any> {
	protected readonly action = GET_EXCHANGE_EMAILS_ACTION;
	protected readonly operationName = 'GetExchangeEmails';

	protected createTemplate(): ISoapTemplate {
		return new GetExchangeEmailsTemplate();
	}
}
