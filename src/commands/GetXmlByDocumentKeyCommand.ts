import { IGetXmlByDocumentKeyParams, ISoapTemplate } from '../common/interfaces';
import { GetXmlByDocumentKeyTemplate } from '../soap/templates/GetXmlByDocumentKeyTemplate';
import { GET_XML_BY_DOCUMENT_KEY_ACTION } from '../common/constants';
import { BaseSoapCommand } from './BaseSoapCommand';

/**
 * Comando para ejecutar la operación GetXmlByDocumentKey de la DIAN.
 */
export class GetXmlByDocumentKeyCommand extends BaseSoapCommand<IGetXmlByDocumentKeyParams, any> {
	protected readonly action = GET_XML_BY_DOCUMENT_KEY_ACTION;
	protected readonly operationName = 'GetXmlByDocumentKey';

	protected createTemplate(): ISoapTemplate {
		return new GetXmlByDocumentKeyTemplate();
	}
}
