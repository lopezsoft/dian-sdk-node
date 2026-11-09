import * as fs from 'fs/promises';
import * as forge from 'node-forge';
import { ICertificateData } from '../common/interfaces';

export class Certificate {
	public async loadFromBuffer(p12Buffer: Buffer, password: string): Promise<ICertificateData> {
		try {
			const p12Asn1 = forge.asn1.fromDer(p12Buffer.toString('binary'));
			const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, password);

			let privateKey: forge.pki.PrivateKey | null = null;
			let certificate: forge.pki.Certificate | null = null;

			const certBags = p12.getBags({ bagType: forge.pki.oids.certBag }) as any;
			const shroudedKeyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag }) as any;
			const plainKeyBags = p12.getBags({ bagType: forge.pki.oids.keyBag }) as any;

			const certList = (certBags?.[forge.pki.oids.certBag] ?? [])
				.map((bag: any) => bag.cert)
				.filter(Boolean);
			const keyList = [
				...(shroudedKeyBags?.[forge.pki.oids.pkcs8ShroudedKeyBag] ?? []),
				...(plainKeyBags?.[forge.pki.oids.keyBag] ?? []),
			]
				.map((bag: any) => bag.key)
				.filter(Boolean);

			if (certList.length === 0) {
				throw new Error('No se pudo encontrar un certificado público en el archivo .p12.');
			}
			if (keyList.length === 0) {
				throw new Error('No se pudo encontrar una llave privada en el archivo .p12.');
			}

			for (const cert of certList) {
				for (const pkey of keyList) {
					// Compara los módulos RSA (n) de la clave privada y el certificado suscriptor
					if (cert.publicKey?.n && (pkey as any).n && cert.publicKey.n.equals((pkey as any).n)) {
						privateKey = pkey as forge.pki.PrivateKey;
						certificate = cert;
						break;
					}
				}
				if (privateKey && certificate) {
					break;
				}
			}

			if (!privateKey || !certificate) {
				throw new Error('No se encontró un par de clave/certificado válido en el archivo .p12.');
			}

			const privateKeyPem = forge.pki.privateKeyToPem(privateKey);
			const publicKeyPem = forge.pki.certificateToPem(certificate);
			const x509CertificateBase64 = publicKeyPem
				.replace(/(-{5}(BEGIN|END) CERTIFICATE-{5}|\s)/g, '');

			return {
				privateKeyPem,
				publicKeyPem,
				x509CertificateBase64,
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			const lowerMessage = errorMessage.toLowerCase();
			if (lowerMessage.includes('mac') || lowerMessage.includes('invalid password')) {
				throw new Error(`La contraseña del certificado es incorrecta. Error original: ${errorMessage}`);
			}
			throw new Error(`Error crítico al procesar el certificado: ${errorMessage}`);
		}
	}

	public async loadFromFile(p12Path: string, password: string): Promise<ICertificateData> {
		const p12Buffer = await fs.readFile(p12Path);
		return this.loadFromBuffer(p12Buffer, password);
	}
}
