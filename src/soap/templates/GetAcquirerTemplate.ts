import { BaseTemplate } from './BaseTemplate';
import { IGetAcquirerParams } from '../../common/interfaces';

/**
 * Plantilla para la acción GetAcquirer de la DIAN.
 */
export class GetAcquirerTemplate extends BaseTemplate {
	public getXml(params: IGetAcquirerParams): string {
		if (!params.identificationType || !params.identificationNumber) {
			throw new Error('Los parámetros identificationType y identificationNumber son requeridos.');
		}
		return this.wrapEnvelope(
			`<wcf:GetAcquirer>
			<wcf:identificationType>${params.identificationType}</wcf:identificationType>
			<wcf:identificationNumber>${params.identificationNumber}</wcf:identificationNumber>
		</wcf:GetAcquirer>`,
		);
	}
}
