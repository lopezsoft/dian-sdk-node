import * as forge from 'node-forge';
import { Certificate } from '../../src/security/Certificate';

const TEST_CERT_PASSWORD = 'tu_password_de_prueba';

/**
 * Genera un contenedor PKCS#12 (.p12) válido en memoria para pruebas unitarias.
 */
function generateTestP12Buffer(password: string): Buffer {
	const keys = forge.pki.rsa.generateKeyPair(2048);
	const cert = forge.pki.createCertificate();
	cert.publicKey = keys.publicKey;
	cert.serialNumber = '78a5d8e5c5f9b4a02145b789a0c3d4e5';
	cert.validity.notBefore = new Date();
	cert.validity.notAfter = new Date();
	cert.validity.notAfter.setFullYear(cert.validity.notAfter.getFullYear() + 1);

	const attrs = [
		{ shortName: 'CN', value: 'Test DIAN P12' },
		{ shortName: 'O', value: 'LopezSoft' },
		{ shortName: 'C', value: 'CO' },
	];
	cert.setSubject(attrs);
	cert.setIssuer(attrs);
	cert.sign(keys.privateKey, forge.md.sha256.create());

	const p12Asn1 = forge.pkcs12.toPkcs12Asn1(keys.privateKey, [cert], password, {
		algorithm: '3des',
	});
	const p12Der = forge.asn1.toDer(p12Asn1).getBytes();
	return Buffer.from(p12Der, 'binary');
}

describe('Certificate', () => {
	let validP12Buffer: Buffer;

	beforeAll(() => {
		validP12Buffer = generateTestP12Buffer(TEST_CERT_PASSWORD);
	});

	it('debería cargar y parsear un certificado .p12 correctamente', async () => {
		const certificate = new Certificate();
		const certData = await certificate.loadFromBuffer(validP12Buffer, TEST_CERT_PASSWORD);

		expect(certData).toBeDefined();
		expect(certData.privateKeyPem).toContain('-----BEGIN');
		expect(certData.publicKeyPem).toContain('-----BEGIN CERTIFICATE-----');
		expect(certData.x509CertificateBase64).not.toContain('-----');
	});

	it('debería lanzar un error si la contraseña es incorrecta', async () => {
		const certificate = new Certificate();
		await expect(certificate.loadFromBuffer(validP12Buffer, 'password_incorrecto'))
			.rejects.toThrow('La contraseña del certificado es incorrecta');
	});

	it('debería lanzar un error si el buffer es inválido', async () => {
		const certificate = new Certificate();
		const invalidBuffer = Buffer.from('contenido-invalido');

		await expect(certificate.loadFromBuffer(invalidBuffer, 'test'))
			.rejects.toThrow('Error crítico al procesar el certificado');
	});
});
