import { BaseXmlSigner } from './BaseXmlSigner';
import { DocumentType, DOCUMENT_TYPE_CONFIG, IDocumentTypeConfig, detectDocumentType } from '../ubl/models';

/**
 * Firmante estándar para documentos UBL (Facturas, Notas Crédito, Notas Débito, Eventos, AttachedDocument, etc.).
 * Diferencia automáticamente los namespaces y ubicación de ExtensionContent por tipo de documento.
 */
export class XmlSigner extends BaseXmlSigner {
  private documentConfig?: IDocumentTypeConfig;
  private explicitDocumentType?: DocumentType;

  /**
   * Establece manualmente el tipo de documento para configurar los namespaces.
   */
  public setDocumentType(type: DocumentType): void {
    this.explicitDocumentType = type;
    this.documentConfig = DOCUMENT_TYPE_CONFIG[type];
  }

  /**
   * Retorna la configuración de namespaces del documento actual.
   */
  public override getDocumentConfig(): IDocumentTypeConfig | undefined {
    return this.documentConfig;
  }

  /**
   * Pre-procesamiento: detecta automáticamente el tipo de documento
   * del XML para configurar los namespaces correspondientes (salvo que se haya fijado explícitamente).
   */
  protected override preSigningTransform(xml: string): string {
    const type = this.explicitDocumentType ?? this.signingOptions?.documentType ?? detectDocumentType(xml);
    this.documentConfig = DOCUMENT_TYPE_CONFIG[type];
    return xml;
  }

  /**
   * Si el documento detectado o configurado es AttachedDocument, utiliza ExtensionContent[0];
   * en caso contrario utiliza ExtensionContent[1].
   */
  protected override getExtensionContentIndex(): number {
    if (this.documentConfig?.type === DocumentType.AttachedDocument) {
      return 0;
    }
    return 1;
  }
}
