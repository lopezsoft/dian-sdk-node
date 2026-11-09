import { XMLParser } from 'fast-xml-parser';
import type { Document as XmlDocument } from '@xmldom/xmldom';

export const fastXmlParser = new XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix: '@_',
	textNodeName: '#text',
	removeNSPrefix: true,
});

export function removeDomChild(document: XmlDocument, tagName: string, item: number = 0): XmlDocument {
	const tag = document.documentElement?.getElementsByTagName(tagName).item(item);
	if (tag && tag.parentNode) {
		tag.parentNode.removeChild(tag);
	}
	return document;
}

export function joinArray(array: Record<string, any>, formatNS: boolean = true, join: string = ' '): string {
	return Object.entries(array)
		.filter(([, value]) => value !== undefined && value !== null)
		.map(([key, value]) => (formatNS ? `${key}="${value}"` : `${key}=${String(value).toUpperCase()}`))
		.join(join);
}

/**
 * Convierte una cadena hexadecimal de longitud arbitraria a su representación decimal.
 * Soporta seriales de certificados X.509 de 16 a 20+ bytes (128-160 bits) emitidos por
 * autoridades certificadoras como FIMA Digital, Viafirma, GSE, Andes SCD, etc., sin
 * pérdida de precisión ni desbordamiento de entero.
 *
 * Réplica de `DIANTrait::hexToDecimal()` de ubl21dian v3.6.9.
 */
export function hexToDecimal(hex: string): string {
	const cleaned = hex.replace(/^0x/i, '').trim();

	if (cleaned === '' || !/^[0-9a-fA-F]+$/.test(cleaned)) {
		throw new Error(`Invalid hexadecimal string: "${hex}"`);
	}

	return BigInt(`0x${cleaned}`).toString(10);
}

/**
 * Formatea una fecha en zona horaria de Colombia (America/Bogota, UTC-5)
 * siguiendo el formato exigido por la DIAN para `<xades:SigningTime>`:
 * `YYYY-MM-DDTHH:mm:ss.SSS-05:00`.
 *
 * Réplica del ajuste de zona horaria de `SignInvoice.php` (ubl21dian v3.2.11).
 */
export function formatColombiaSigningTime(date: Date = new Date()): string {
	const colombiaOffsetMs = -5 * 60 * 60 * 1000;
	const colombiaTime = new Date(date.getTime() + colombiaOffsetMs);
	const isoUtc = colombiaTime.toISOString();
	return isoUtc.slice(0, -1) + '-05:00';
}
