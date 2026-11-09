# DIAN SDK Node

[![Versión](https://img.shields.io/badge/versi%C3%B3n-2.2.0-1d4ed8)](CHANGELOG.md)
[![NPM](https://img.shields.io/badge/npm-dian--sdk--node-cb3837)](https://www.npmjs.com/package/dian-sdk-node)

SDK desacoplado en **Node.js y TypeScript** diseñado para la firma electrónica **XAdES-EPES** de documentos UBL 2.1 / Nómina Electrónica y la comunicación **SOAP 1.2 (WS-Security)** con los servicios web de la **DIAN** en Colombia.

Este proyecto es la evolución y migración a Node.js de `lopezsoft/ubl21dian` (paridad completa con **v3.6.9**), construido bajo principios **SOLID**, **Clean Code** y **Patrones de Diseño** (*Facade*, *Command*, *Template Method*, *Strategy* y *Factory*).

---

## ✨ Características Principales

- **Paridad Total con `ubl21dian` v3.6.9**:
  - Firma **XAdES-EPES** en una sola pasada con las 3 referencias obligatorias (`Documento Raíz`, `KeyInfo` y `SignedProperties`), propagación de namespaces UBL en C14N, `CertDigest` sobre certificado X.509 DER completo y `SignerRole` (`supplier`).
  - Conversión hexadecimal a decimal de precisión arbitraria (`hexToDecimal` con `BigInt`) para `<ds:X509SerialNumber>` (soporta seriales de 16–20+ bytes de FIMA Digital, Viafirma, GSE y Andes SCD).
  - `<xades:SigningTime>` en zona horaria de Colombia (`America/Bogota`, `-05:00`).
  - Prevención del error DIAN `FAD06` mediante truncamiento estricto a 2 decimales (`truncateDecimals`) y evaluación exclusiva de `<cac:TaxTotal>` a nivel raíz.
  - Soporte para Sector Salud (`CustomTagGeneral` / Minsalud) y Nómina de Ajuste de Eliminación.
- **Arquitectura Desacoplada y Flujo Dual**:
  - Comandos de envío que soportan tanto **firma al vuelo** (`unsigned*Xml` + `signingOptions` opcionales) como envío directo de archivos **pre-firmados o ZIP en base64** (`contentFile`).
  - Uso independiente (*standalone*) de firmantes (`XmlSigner`, `PayrollSigner`, `AttachedDocumentSigner`, `DocumentSupportSigner`, `AdjustmentNoteSigner`, `XmlSignerFactory`) y utilidades UBL (`calculateCufe`, `calculateCude`, `calculateCuds`, `calculateCune`, `calculateCudeEvent`, `injectUuid`, `getQRDataInvoice`, `getQRDataDocumentSupport`, `getQRDataPayroll`).

---

## 📦 Instalación

```bash
npm install dian-sdk-node
```

---

## 🚀 Uso Básico

### 1. Enviar una Factura Electrónica (Firma al vuelo o con Inyección Automática de CUFE)

```typescript
import * as fs from 'fs/promises';
import { DianClient, SendBillSyncCommand } from 'dian-sdk-node';

async function sendInvoice() {
  // 1. Configurar el cliente (environment: 1 = PRODUCCIÓN, 2 = HABILITACIÓN)
  const client = new DianClient({ environment: 2 });

  // 2. Inicializar con el certificado digital (.p12 / .pfx)
  const certificate = await fs.readFile('./certs/certificado_pruebas.p12');
  await client.initialize({
    certificate,
    password: 'tu_contraseña_del_certificado',
  });

  // 3. Cargar el XML de la factura sin firmar
  const unsignedInvoiceXml = await fs.readFile('./examples/factura-sin-firmar.xml', 'utf-8');

  // 4. Ejecutar el comando (puede inyectar SoftwareSecurityCode, CUFE y QR automáticamente antes de firmar)
  const response = await client.execute(new SendBillSyncCommand(), {
    fileName: 'FV-DEMO-001.xml',
    unsignedUblXml: unsignedInvoiceXml,
    signingOptions: {
      softwareID: 'tu-software-id',
      pin: '12345',
      technicalKey: 'fc8eac422eba16e22ffd8c6f94b3f40a6e38162c',
    },
  });

  console.log('Respuesta DIAN:', response);
}
```

### 2. Enviar un Archivo Pre-Firmado o ZIP en Base64 (`contentFile`)

```typescript
import { DianClient, SendBillSyncCommand } from 'dian-sdk-node';

const response = await client.execute(new SendBillSyncCommand(), {
  fileName: 'FV-DEMO-001.xml',
  contentFile: base64SignedXmlOrZip,
});
```

### 3. Firma XAdES-EPES Independiente (*Standalone*) sin Enviar por SOAP

```typescript
import { Certificate, XmlSignerFactory } from 'dian-sdk-node';

const certData = await new Certificate().loadFromFile('./certs/certificado.p12', 'contraseña');
const factory = new XmlSignerFactory();
const signer = factory.createForXml(unsignedXml);

const signedXml = signer.sign(unsignedXml, certData, undefined, undefined, {
  softwareID: 'tu-software-id',
  pin: '12345',
  technicalKey: 'fc8eac422eba16e22ffd8c6f94b3f40a6e38162c',
});
```

---

## 📚 Comandos SOAP Disponibles (`/commands`)

| Comando | Operación DIAN | Parámetros (`params`) |
| :--- | :--- | :--- |
| **`SendBillSyncCommand`** | Envío síncrono de factura / nota / DS | `{ fileName: string, unsignedUblXml?: string, contentFile?: string, signingOptions?: IXmlSignOptions }` |
| **`SendBillAsyncCommand`** | Envío asíncrono de factura / ZIP | `{ fileName: string, unsignedUblXml?: string, contentFile?: string, signingOptions?: IXmlSignOptions }` |
| **`SendBillAttachmentAsyncCommand`** | Envío asíncrono de `AttachedDocument` | `{ fileName: string, unsignedAttachedDocumentXml?: string, contentFile?: string, signingOptions?: IXmlSignOptions }` |
| **`SendNominaSyncCommand`** | Envío síncrono de Nómina Electrónica | `{ unsignedPayrollXml?: string, contentFile?: string, signingOptions?: IXmlSignOptions }` |
| **`SendEventCommand`** | Envío de eventos RADIAN (`SendEventUpdateStatus`) | `{ unsignedEventXml?: string, contentFile?: string, signingOptions?: IXmlSignOptions }` |
| **`SendTestSetAsyncCommand`** | Envío de Set de Pruebas (`TestSet`) | `{ fileName: string, contentFile: string, testSetId: string }` |
| **`GetStatusCommand`** | Consulta de estado por CUFE/CUDE/CUNE | `{ trackId: string }` |
| **`GetStatusZipCommand`** | Consulta de estado de paquete por `ZipKey` | `{ trackId: string }` |
| **`GetStatusEventCommand`** | Consulta de estado de eventos RADIAN | `{ trackId: string }` |
| **`GetXmlByDocumentKeyCommand`** | Descarga de XML firmado por CUFE/CUDE | `{ trackId: string }` |
| **`GetNumberingRangeCommand`** | Consulta de rangos de numeración | `{ accountCode: string, accountCodeT: string, softwareCode: string }` |
| **`GetReferenceNotesCommand`** | Consulta de notas asociadas a una factura | `{ trackId: string }` |
| **`GetAcquirerCommand`** | Consulta de adquirente por tipo y documento | `{ identificationType: string, identificationNumber: string }` |
| **`GetExchangeEmailsCommand`** | Consulta de correos de recepción del facturador | `{}` |

---

## 📄 Licencia

Este proyecto está distribuido bajo licencia de código abierto. Consulta el archivo [`LICENSE`](LICENSE) para más detalles.
