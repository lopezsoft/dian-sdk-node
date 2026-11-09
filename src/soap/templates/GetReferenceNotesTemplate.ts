import { BaseTemplate } from './BaseTemplate';
import { IGetReferenceNotesParams } from '../../common/interfaces';

/**
 * Plantilla para la acción GetReferenceNotes de la DIAN.
 */
export class GetReferenceNotesTemplate extends BaseTemplate {
	public getXml(params: IGetReferenceNotesParams): string {
		if (!params.trackId) {
			throw new Error('El parámetro trackId es requerido.');
		}
		return this.wrapEnvelope(
			`<wcf:GetReferenceNotes>
			<wcf:trackId>${params.trackId}</wcf:trackId>
		</wcf:GetReferenceNotes>`,
		);
	}
}
