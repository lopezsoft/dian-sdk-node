import { IGetStatusEventParams, ISoapTemplate } from '../common/interfaces';
import { GetStatusEventTemplate } from '../soap/templates/GetStatusEventTemplate';
import { GET_STATUS_EVENT_ACTION } from '../common/constants';
import { BaseSoapCommand } from './BaseSoapCommand';

/**
 * Comando para ejecutar la operación GetStatusEvent de la DIAN.
 * Consulta el estado de un evento enviado.
 */
export class GetStatusEventCommand extends BaseSoapCommand<IGetStatusEventParams, any> {
	protected readonly action = GET_STATUS_EVENT_ACTION;
	protected readonly operationName = 'GetStatusEvent';

	protected createTemplate(): ISoapTemplate {
		return new GetStatusEventTemplate();
	}
}
