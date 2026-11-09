import { ISendTestSetAsyncParams, ISoapTemplate } from '../common/interfaces';
import { SendTestSetAsyncTemplate } from '../soap/templates/SendTestSetAsyncTemplate';
import { SEND_TEST_SET_ASYNC_ACTION } from '../common/constants';
import { BaseSoapCommand } from './BaseSoapCommand';

/**
 * Comando para ejecutar la operación SendTestSetAsync de la DIAN.
 * Envía un conjunto de pruebas (TestSet) al ambiente de habilitación.
 */
export class SendTestSetAsyncCommand extends BaseSoapCommand<ISendTestSetAsyncParams, any> {
	protected readonly action = SEND_TEST_SET_ASYNC_ACTION;
	protected readonly operationName = 'SendTestSetAsync';

	protected createTemplate(): ISoapTemplate {
		return new SendTestSetAsyncTemplate();
	}
}
