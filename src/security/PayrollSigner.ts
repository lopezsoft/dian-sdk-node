import { BaseXmlSigner } from './BaseXmlSigner';
import { DocumentType, DOCUMENT_TYPE_CONFIG, IDocumentTypeConfig } from '../ubl/models';

/**
 * Firmante especializado para documentos de Nómina Electrónica (Individual y de Ajuste).
 * Sobreescribe los "hooks" para manejar la transformación temporal de namespaces (`urn:`)
 * requerida por los parsers XML/C14N antes y después de firmar.
 *
 * Réplica de `SignPayroll.php`.
 */
export class PayrollSigner extends BaseXmlSigner {
	private documentConfig: IDocumentTypeConfig = DOCUMENT_TYPE_CONFIG[DocumentType.Payroll];

	public override getDocumentConfig(): IDocumentTypeConfig {
		return this.documentConfig;
	}

	protected override preSigningTransform(xml: string): string {
		if (xml.includes('NominaIndividualDeAjuste')) {
			this.documentConfig = DOCUMENT_TYPE_CONFIG[DocumentType.PayrollAdjustment];
			return xml.replace(
				'xmlns="dian:gov:co:facturaelectronica:NominaIndividualDeAjuste"',
				'xmlns="urn:dian:gov:co:facturaelectronica:NominaIndividualDeAjuste"'
			);
		}
		this.documentConfig = DOCUMENT_TYPE_CONFIG[DocumentType.Payroll];
		return xml.replace(
			'xmlns="dian:gov:co:facturaelectronica:NominaIndividual"',
			'xmlns="urn:dian:gov:co:facturaelectronica:NominaIndividual"'
		);
	}

	protected override postSigningTransform(xml: string): string {
		if (xml.includes('NominaIndividualDeAjuste')) {
			return xml.replace(
				'xmlns="urn:dian:gov:co:facturaelectronica:NominaIndividualDeAjuste"',
				'xmlns="dian:gov:co:facturaelectronica:NominaIndividualDeAjuste"'
			);
		}
		return xml.replace(
			'xmlns="urn:dian:gov:co:facturaelectronica:NominaIndividual"',
			'xmlns="dian:gov:co:facturaelectronica:NominaIndividual"'
		);
	}
}
