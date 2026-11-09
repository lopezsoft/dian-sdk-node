import { BaseTemplate } from './BaseTemplate';
import { IGetStatusCommandParams } from '../../common/interfaces';

export type IGetStatusParams = IGetStatusCommandParams;

/**
 * Plantilla para la acción GetStatus del web service de la DIAN.
 */
export class GetStatusTemplate extends BaseTemplate {
	/**
	 * Genera el XML para la petición GetStatus.
	 * @param params Objeto que debe contener la propiedad `trackId`.
	 * @returns El sobre SOAP para la petición.
	 */
	public getXml(params: IGetStatusCommandParams): string {
		if (!params.trackId) {
			throw new Error('El parámetro trackId es requerido para GetStatus.');
		}

		return this.wrapEnvelope(
			`<wcf:GetStatus>
			<wcf:trackId>${params.trackId}</wcf:trackId>
		</wcf:GetStatus>`,
		);
	}
}
