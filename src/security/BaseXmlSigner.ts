import * as crypto from 'crypto';
import { DOMParser, XMLSerializer, Document as XmlDocument } from '@xmldom/xmldom';
import { SignedXml } from 'xml-crypto';
import * as forge from 'node-forge';
import { ICertificateData, IXmlSigner, IXmlSignOptions } from '../common/interfaces';
import {
	C14N,
	ENVELOPED_SIGNATURE,
	POLITICA_FIRMA_V2,
	POLITICA_FIRMA_V2_VALUE,
	SIGNED_PROPERTIES_TYPE,
	XADES141_NS,
	XADES_NS,
	XMLDSIG,
} from '../common/constants';
import { formatColombiaSigningTime, hexToDecimal, joinArray } from '../common/utils';
import { IDocumentTypeConfig } from '../ubl/models';
import { applyPreSignUblExtensions } from '../ubl/DianExtensions';

/**
 * Configuración de algoritmo de firma soportados por la DIAN.
 * Replica las constantes ALGO_SHA1, ALGO_SHA256 y ALGO_SHA512 del PHP.
 */
export interface ISignatureAlgorithm {
	rsa: string;
	digest: string;
	hash: string;
}

export const ALGO_SHA1: ISignatureAlgorithm = {
	rsa: 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha1',
	digest: 'http://www.w3.org/2001/04/xmlenc#sha1',
	hash: 'sha1',
};

export const ALGO_SHA256: ISignatureAlgorithm = {
	rsa: 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256',
	digest: 'http://www.w3.org/2001/04/xmlenc#sha256',
	hash: 'sha256',
};

export const ALGO_SHA512: ISignatureAlgorithm = {
	rsa: 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha512',
	digest: 'http://www.w3.org/2001/04/xmlenc#sha512',
	hash: 'sha512',
};

interface IXadesIdentifiers {
	signatureId: string;
	signatureValueId: string;
	keyInfoId: string;
	referenceId: string;
	signedPropertiesId: string;
}

/**
 * Clase base abstracta para la firma XAdES-EPES de documentos XML (UBL y Nómina).
 * Utiliza el patrón Template Method para definir el esqueleto del algoritmo de firma,
 * permitiendo que las subclases redefinan pasos específicos sin cambiar la estructura.
 *
 * Réplica fiel en un solo paso (sin doble firmado) de `SignInvoice.php` / `Sign.php` de ubl21dian v3.6.9.
 */
export abstract class BaseXmlSigner implements IXmlSigner {
	protected algorithm: ISignatureAlgorithm = ALGO_SHA256;
	protected signingOptions?: IXmlSignOptions;

	/**
	 * Permite configurar el algoritmo de firma (SHA1, SHA256, SHA512).
	 * Por defecto se usa SHA256 (el estándar exigido por la DIAN).
	 */
	public setAlgorithm(algorithm: ISignatureAlgorithm): void {
		this.algorithm = algorithm;
	}

	/**
	 * Permite configurar opciones de pre-procesamiento UBL (softwareID, pin, technicalKey)
	 * para inyectar automáticamente SoftwareSecurityCode, UUID/CUFE/CUDE/CUDS/CUNE y QRCode
	 * antes de ejecutar la firma XAdES-EPES.
	 */
	public setSigningOptions(options: IXmlSignOptions): void {
		this.signingOptions = options;
		if (options.algorithm) {
			this.setAlgorithm(options.algorithm);
		}
	}

	/**
	 * Retorna la configuración de documento asociada al firmante (si aplica).
	 */
	public getDocumentConfig(): IDocumentTypeConfig | undefined {
		return undefined;
	}

	/**
	 * El "Template Method" principal. Orquesta el proceso de firma XAdES-EPES completo en una sola pasada:
	 * 1. Valida el algoritmo configurado (rechaza SHA1 deprecado).
	 * 2. Inyección opcional de extensiones DIAN (SoftwareSecurityCode, UUID/CUFE/CUDE/CUDS/CUNE, QRCode).
	 * 3. Transformación previa del XML (`preSigningTransform`).
	 * 4. Cálculo del digest C14N enveloped del documento raíz (`Reference URI=""`).
	 * 5. Construcción de `<ds:KeyInfo>` y `<ds:Object><xades:QualifyingProperties>` (con `CertDigest` DER,
	 *    `X509SerialNumber` en decimal vía `hexToDecimal`, `SigningTime` en `-05:00` y `SignerRole` = `supplier`).
	 * 6. Cálculo de los digests C14N de `#KeyInfo` y `#SignedProperties` con propagación de namespaces del documento.
	 * 7. Firma RSA (`RSA-SHA256` / `RSA-SHA512`) sobre `<ds:SignedInfo>` completo (con las 3 referencias XAdES-EPES).
	 * 8. Inserción en `<ext:ExtensionContent>` y transformación posterior (`postSigningTransform`).
	 */
	public sign(
		xml: string | any,
		certificateData: ICertificateData,
		_action?: string,
		_toValue?: string,
		options?: IXmlSignOptions,
	): string {
		const effectiveOptions = options ?? this.signingOptions;
		if (effectiveOptions?.algorithm) {
			this.setAlgorithm(effectiveOptions.algorithm);
		}

		// Validar algoritmo (SHA1 está deprecado en xml-crypto v6 y DIAN v1.9)
		if (this.algorithm.hash === 'sha1') {
			throw new Error('El algoritmo RSA-SHA1 está deprecado y no es soportado.');
		}

		const rawXml = typeof xml === 'string' ? xml : new XMLSerializer().serializeToString(xml);
		const xmlWithUblExtensions = applyPreSignUblExtensions(rawXml, effectiveOptions);
		const preProcessedXml = this.preSigningTransform(xmlWithUblExtensions);

		const signedDoc = new DOMParser().parseFromString(preProcessedXml, 'text/xml');
		if (!signedDoc.documentElement) {
			throw new Error('El documento XML a firmar no contiene un elemento raíz válido.');
		}

		const extensionNode = this.findTargetExtensionContentNode(signedDoc, preProcessedXml);
		const c14nEngine = new SignedXml();
		const ids = this.generateXadesIdentifiers();
		const namespacesAttrString = this.buildDocumentNamespacesString(signedDoc);

		// 1. Calcular DigestValue C14N del documento completo antes de insertar <ds:Signature>
		// (equivalente exacto a la transformación enveloped-signature + C14N de SignInvoice.php)
		const docCanonXml = this.canonicalizeDomNode(c14nEngine, signedDoc.documentElement);
		const docDigest = crypto.createHash(this.algorithm.hash).update(docCanonXml, 'utf8').digest('base64');

		// 2. Construir <ds:KeyInfo> y calcular su DigestValue C14N con namespaces propagados
		const keyInfoFragment =
			`<ds:KeyInfo xmlns:ds="${XMLDSIG}" Id="${ids.keyInfoId}">` +
			`<ds:X509Data><ds:X509Certificate>${certificateData.x509CertificateBase64}</ds:X509Certificate></ds:X509Data>` +
			`</ds:KeyInfo>`;
		const keyInfoWithNs = this.injectNamespacesIntoRootTag(keyInfoFragment, 'ds:KeyInfo', namespacesAttrString);
		const keyInfoCanon = this.canonicalizeXmlFragment(c14nEngine, keyInfoWithNs);
		const keyInfoDigest = crypto.createHash(this.algorithm.hash).update(keyInfoCanon, 'utf8').digest('base64');

		// 3. Construir <ds:Object><xades:QualifyingProperties> y calcular DigestValue C14N de <xades:SignedProperties>
		const { xadesObjectXml, signedPropertiesXml } = this.buildXadesStructures(certificateData, ids);
		const signedPropsWithNs = this.injectNamespacesIntoRootTag(
			signedPropertiesXml,
			'xades:SignedProperties',
			namespacesAttrString,
		);
		const signedPropsCanon = this.canonicalizeXmlFragment(c14nEngine, signedPropsWithNs);
		const signedPropsDigest = crypto.createHash(this.algorithm.hash).update(signedPropsCanon, 'utf8').digest('base64');

		// 4. Construir <ds:SignedInfo> con las 3 referencias obligatorias XAdES-EPES y firmarlo
		const signedInfoXml =
			`<ds:SignedInfo>` +
			`<ds:CanonicalizationMethod Algorithm="${C14N}"/>` +
			`<ds:SignatureMethod Algorithm="${this.algorithm.rsa}"/>` +
			`<ds:Reference Id="${ids.referenceId}" URI="">` +
			`<ds:Transforms><ds:Transform Algorithm="${ENVELOPED_SIGNATURE}"/></ds:Transforms>` +
			`<ds:DigestMethod Algorithm="${this.algorithm.digest}"/>` +
			`<ds:DigestValue>${docDigest}</ds:DigestValue>` +
			`</ds:Reference>` +
			`<ds:Reference URI="#${ids.keyInfoId}">` +
			`<ds:DigestMethod Algorithm="${this.algorithm.digest}"/>` +
			`<ds:DigestValue>${keyInfoDigest}</ds:DigestValue>` +
			`</ds:Reference>` +
			`<ds:Reference Type="${SIGNED_PROPERTIES_TYPE}" URI="#${ids.signedPropertiesId}">` +
			`<ds:DigestMethod Algorithm="${this.algorithm.digest}"/>` +
			`<ds:DigestValue>${signedPropsDigest}</ds:DigestValue>` +
			`</ds:Reference>` +
			`</ds:SignedInfo>`;

		const signedInfoWithNs = this.injectNamespacesIntoRootTag(
			signedInfoXml,
			'ds:SignedInfo',
			namespacesAttrString,
		);
		const canonicalizedSignedInfo = this.canonicalizeXmlFragment(c14nEngine, signedInfoWithNs);

		const nodeSignAlgorithm = this.algorithm.hash === 'sha512' ? 'RSA-SHA512' : 'RSA-SHA256';
		const signer = crypto.createSign(nodeSignAlgorithm);
		signer.update(canonicalizedSignedInfo, 'utf8');
		const signatureBase64 = signer.sign(certificateData.privateKeyPem, 'base64');

		// 5. Ensamblar <ds:Signature> completo e insertarlo en <ext:ExtensionContent>
		const fullSignatureXml =
			`<ds:Signature xmlns:ds="${XMLDSIG}" Id="${ids.signatureId}">` +
			signedInfoXml +
			`<ds:SignatureValue Id="${ids.signatureValueId}">${signatureBase64}</ds:SignatureValue>` +
			`<ds:KeyInfo Id="${ids.keyInfoId}">` +
			`<ds:X509Data><ds:X509Certificate>${certificateData.x509CertificateBase64}</ds:X509Certificate></ds:X509Data>` +
			`</ds:KeyInfo>` +
			xadesObjectXml +
			`</ds:Signature>`;

		const signatureDomNode = new DOMParser().parseFromString(fullSignatureXml, 'text/xml').documentElement!;
		extensionNode.appendChild(signatureDomNode);

		const finalXml = new XMLSerializer().serializeToString(signedDoc as any);
		return this.postSigningTransform(finalXml);
	}

	/**
	 * Hook para transformaciones ANTES de la firma. Las subclases pueden sobreescribirlo.
	 */
	protected preSigningTransform(xml: string): string {
		return xml;
	}

	/**
	 * Hook para transformaciones DESPUÉS de la firma. Las subclases pueden sobreescribirlo.
	 */
	protected postSigningTransform(xml: string): string {
		return xml;
	}

	/**
	 * Hook que define el índice base de ExtensionContent donde insertar la firma.
	 * - UBL estándar (Invoice, CreditNote, DebitNote): índice 1
	 * - AttachedDocument: índice 0
	 * - Documentos Sector Salud (Minsalud / CustomTagGeneral): índice 2 (resuelto dinámicamente)
	 */
	protected getExtensionContentIndex(): number {
		return 1;
	}

	/**
	 * Localiza el nodo `<ext:ExtensionContent>` destino, contemplando Sector Salud
	 * (`CustomTagGeneral` / `www.minsalud.gov.co`) y acotando al número real de bloques
	 * `ExtensionContent` presentes en el documento.
	 */
	protected findTargetExtensionContentNode(doc: XmlDocument, rawXml: string): any {
		let index = this.getExtensionContentIndex();

		if (rawXml.includes('CustomTagGeneral') || rawXml.includes('www.minsalud.gov.co')) {
			index = 2;
		}

		let extNodes = doc.getElementsByTagName('ext:ExtensionContent');
		if (extNodes.length === 0) {
			extNodes = doc.getElementsByTagName('ExtensionContent');
		}
		if (extNodes.length === 0) {
			throw new Error('No se encontró ningún nodo <ext:ExtensionContent> en el XML para alojar la firma.');
		}

		const boundedIndex = Math.min(index, extNodes.length - 1);
		return extNodes.item(boundedIndex);
	}

	private buildXadesStructures(
		certData: ICertificateData,
		ids: IXadesIdentifiers,
	): { xadesObjectXml: string; signedPropertiesXml: string } {
		const cert = forge.pki.certificateFromPem(certData.publicKeyPem);
		// El digest del certificado en XAdES-EPES DIAN se calcula sobre el certificado X.509 DER completo
		// (réplica exacta de openssl_x509_fingerprint($this->certs['cert'], $this->algorithm['hash'], true))
		const certDerBytes = Buffer.from(certData.x509CertificateBase64.replace(/\s+/g, ''), 'base64');
		const certDigest = crypto.createHash(this.algorithm.hash).update(certDerBytes).digest('base64');

		const issuerName = this.formatIssuerName([...cert.issuer.attributes]);
		const serialNumber = hexToDecimal(cert.serialNumber);
		const signingTime = formatColombiaSigningTime();

		const signedPropertiesXml =
			`<xades:SignedProperties xmlns:xades="${XADES_NS}" xmlns:xades141="${XADES141_NS}" Id="${ids.signedPropertiesId}">` +
			`<xades:SignedSignatureProperties>` +
			`<xades:SigningTime>${signingTime}</xades:SigningTime>` +
			`<xades:SigningCertificate>` +
			`<xades:Cert>` +
			`<xades:CertDigest>` +
			`<ds:DigestMethod Algorithm="${this.algorithm.digest}"/>` +
			`<ds:DigestValue>${certDigest}</ds:DigestValue>` +
			`</xades:CertDigest>` +
			`<xades:IssuerSerial>` +
			`<ds:X509IssuerName>${issuerName}</ds:X509IssuerName>` +
			`<ds:X509SerialNumber>${serialNumber}</ds:X509SerialNumber>` +
			`</xades:IssuerSerial>` +
			`</xades:Cert>` +
			`</xades:SigningCertificate>` +
			`<xades:SignaturePolicyIdentifier>` +
			`<xades:SignaturePolicyId>` +
			`<xades:SigPolicyId>` +
			`<xades:Identifier>${POLITICA_FIRMA_V2}</xades:Identifier>` +
			`</xades:SigPolicyId>` +
			`<xades:SigPolicyHash>` +
			`<ds:DigestMethod Algorithm="${this.algorithm.digest}"/>` +
			`<ds:DigestValue>${POLITICA_FIRMA_V2_VALUE}</ds:DigestValue>` +
			`</xades:SigPolicyHash>` +
			`</xades:SignaturePolicyId>` +
			`</xades:SignaturePolicyIdentifier>` +
			`<xades:SignerRole>` +
			`<xades:ClaimedRoles>` +
			`<xades:ClaimedRole>supplier</xades:ClaimedRole>` +
			`</xades:ClaimedRoles>` +
			`</xades:SignerRole>` +
			`</xades:SignedSignatureProperties>` +
			`</xades:SignedProperties>`;

		const xadesObjectXml =
			`<ds:Object>` +
			`<xades:QualifyingProperties xmlns:xades="${XADES_NS}" xmlns:xades141="${XADES141_NS}" Target="#${ids.signatureId}">` +
			signedPropertiesXml.replace(` xmlns:xades="${XADES_NS}" xmlns:xades141="${XADES141_NS}"`, '') +
			`</xades:QualifyingProperties>` +
			`</ds:Object>`;

		return { xadesObjectXml, signedPropertiesXml };
	}

	/**
	 * Construye la cadena de atributos `xmlns...` que C14N propaga desde el elemento raíz del documento
	 * hacia `SignedInfo`, `KeyInfo` y `SignedProperties` (réplica de `$this->ns` en `SignInvoice.php`).
	 */
	private buildDocumentNamespacesString(doc: XmlDocument): string {
		const config = this.getDocumentConfig();
		const root = doc.documentElement;
		const rootDefaultNs = root?.getAttribute('xmlns');

		if (config && config.ns) {
			const nsCopy: Record<string, string> = { ...config.ns };
			// Si preSigningTransform ajustó el xmlns raíz (ej. urn: en Nómina Individual), sincronizarlo
			if (rootDefaultNs) {
				nsCopy['xmlns'] = rootDefaultNs;
			}
			return joinArray(nsCopy, true, ' ');
		}

		const nsMap: Record<string, string> = {
			'xmlns:ds': XMLDSIG,
		};
		if (root && root.attributes) {
			for (let i = 0; i < root.attributes.length; i++) {
				const attr = root.attributes.item(i);
				if (attr && (attr.name === 'xmlns' || attr.name.startsWith('xmlns:'))) {
					nsMap[attr.name] = attr.value;
				}
			}
		}
		return joinArray(nsMap, true, ' ');
	}

	/**
	 * Inyecta los atributos de namespace en la etiqueta raíz de un fragmento XML sin duplicar
	 * atributos `xmlns` que ya estén declarados en dicha etiqueta.
	 */
	private injectNamespacesIntoRootTag(xmlFragment: string, tagName: string, namespacesAttrString: string): string {
		if (!namespacesAttrString) {
			return xmlFragment;
		}
		const openTagEnd = xmlFragment.indexOf('>');
		if (openTagEnd === -1) {
			return xmlFragment;
		}
		const openTag = xmlFragment.substring(0, openTagEnd);
		const filteredNs = namespacesAttrString
			.split(/\s+/)
			.filter(pair => {
				const eqIdx = pair.indexOf('=');
				if (eqIdx === -1) return false;
				const attrName = pair.substring(0, eqIdx);
				return !openTag.includes(`${attrName}=`);
			})
			.join(' ');

		if (!filteredNs) {
			return xmlFragment;
		}
		return xmlFragment.replace(`<${tagName}`, `<${tagName} ${filteredNs}`);
	}

	/**
	 * Canonicaliza un nodo DOM existente usando el algoritmo C14N estándar (`http://www.w3.org/TR/2001/REC-xml-c14n-20010315`).
	 */
	private canonicalizeDomNode(signature: SignedXml, node: any): string {
		if (typeof (signature as any).getCanonXml === 'function') {
			return (signature as any).getCanonXml([C14N], node);
		}
		return new XMLSerializer().serializeToString(node);
	}

	/**
	 * Canonicaliza un fragmento XML en string usando el algoritmo C14N estándar (`http://www.w3.org/TR/2001/REC-xml-c14n-20010315`).
	 */
	private canonicalizeXmlFragment(signature: SignedXml, xmlFragment: string): string {
		const tempDoc = new DOMParser().parseFromString(xmlFragment, 'text/xml');
		const rootElement = tempDoc.documentElement;
		if (!rootElement) {
			return xmlFragment;
		}
		return this.canonicalizeDomNode(signature, rootElement);
	}

	/**
	 * Formatea el Distinguished Name (DN) del emisor del certificado X.509 en orden inverso,
	 * contemplando atributos estándar y OIDs comunes en CAs colombianas (`serialNumber`, `emailAddress`).
	 */
	private formatIssuerName(attributes: any[]): string {
		const oidNameMap: Record<string, string> = {
			C: 'C',
			O: 'O',
			OU: 'OU',
			CN: 'CN',
			ST: 'ST',
			L: 'L',
			E: 'emailAddress',
			emailAddress: 'emailAddress',
			serialNumber: 'serialNumber',
			'2.5.4.5': 'serialNumber',
			'1.2.840.113549.1.9.1': 'emailAddress',
		};
		return attributes
			.reverse()
			.map(attr => {
				const rawKey = attr.shortName || attr.name || attr.type || 'CN';
				const key = oidNameMap[rawKey] || rawKey;
				return `${key}=${attr.value}`;
			})
			.join(',');
	}

	private generateXadesIdentifiers(): IXadesIdentifiers {
		const signatureId = `xmldsig-${crypto.randomUUID()}`;
		return {
			signatureId,
			signatureValueId: `${signatureId}-sigvalue`,
			keyInfoId: `xmldsig-${crypto.randomUUID()}-keyinfo`,
			referenceId: `xmldsig-${crypto.randomUUID()}-ref0`,
			signedPropertiesId: `${signatureId}-signedprops`,
		};
	}
}
