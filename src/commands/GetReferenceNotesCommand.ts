import { IGetReferenceNotesParams, ISoapTemplate } from '../common/interfaces';
import { GetReferenceNotesTemplate } from '../soap/templates/GetReferenceNotesTemplate';
import { GET_REFERENCE_NOTES_ACTION } from '../common/constants';
import { BaseSoapCommand } from './BaseSoapCommand';

/**
 * Comando para ejecutar la operación GetReferenceNotes de la DIAN.
 */
export class GetReferenceNotesCommand extends BaseSoapCommand<IGetReferenceNotesParams, any> {
	protected readonly action = GET_REFERENCE_NOTES_ACTION;
	protected readonly operationName = 'GetReferenceNotes';

	protected createTemplate(): ISoapTemplate {
		return new GetReferenceNotesTemplate();
	}
}
