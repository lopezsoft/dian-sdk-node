import { IXmlSigner, IXmlSignerFactory } from '../common/interfaces';
import { DocumentType, detectDocumentType } from '../ubl/models';
import { AdjustmentNoteSigner } from './AdjustmentNoteSigner';
import { AttachedDocumentSigner } from './AttachedDocumentSigner';
import { DocumentSupportSigner } from './DocumentSupportSigner';
import { PayrollSigner } from './PayrollSigner';
import { XmlSigner } from './XmlSigner';

/**
 * Fábrica desacoplada de firmantes XAdES-EPES (Patrón Factory + Open/Closed Principle).
 * Resuelve la estrategia de firma adecuada según el `DocumentType` explícito o
 * auto-detectado a partir del contenido XML.
 */
export class XmlSignerFactory implements IXmlSignerFactory {
	/**
	 * Crea el firmante correspondiente al tipo de documento indicado.
	 */
	public createForDocumentType(type: DocumentType): IXmlSigner {
		switch (type) {
			case DocumentType.Payroll:
			case DocumentType.PayrollAdjustment:
				return new PayrollSigner();
			case DocumentType.AttachedDocument:
				return new AttachedDocumentSigner();
			case DocumentType.DocumentSupport:
				return new DocumentSupportSigner();
			case DocumentType.AdjustmentNote:
				return new AdjustmentNoteSigner();
			case DocumentType.Invoice:
			case DocumentType.CreditNote:
			case DocumentType.DebitNote:
			case DocumentType.ApplicationResponse:
			default: {
				const signer = new XmlSigner();
				signer.setDocumentType(type);
				return signer;
			}
		}
	}

	/**
	 * Detecta el tipo de documento en el XML (o usa `explicitType` si se provee)
	 * y retorna la instancia del firmante especializado correspondiente.
	 */
	public createForXml(xml: string, explicitType?: DocumentType): IXmlSigner {
		const resolvedType = explicitType ?? detectDocumentType(xml);
		return this.createForDocumentType(resolvedType);
	}
}
