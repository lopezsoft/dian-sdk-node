# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [2.2.3] - 2026-11-08

### Fixed
- **Inclusión de `package-lock.json` en Git para GitHub Actions (`CI/CD`)**:
  - Eliminada la regla legacy en `.gitignore` que ignoraba `package-lock.json` y el propio `.gitignore`, corrigiendo el error `Dependencies lock file is not found` en `actions/setup-node@v4` (`cache: 'npm'`) y `npm ci`.
  - Configurado `continue-on-error: true` en el paso informativo de `npm audit` en `ci.yml` y actualizado `release.yml` a Node.js `22.x`.

## [2.2.2] - 2026-11-08

### Added
- **Pipeline CD de Publicación Open Source (`.github/workflows/release.yml`)**:
  - Creación automática de **GitHub Releases** oficiales al publicar tags SemVer (`v*.*.*`).
  - Publicación automatizada en el registro público de **NPM** (`npmjs.com`) con atestación criptográfica de origen (`--provenance --access public`) cuando está configurado el secret `NPM_TOKEN`.
- **Endurecimiento de CI y Empaquetado (`package.json` y `.github/workflows/ci.yml`)**:
  - Lista blanca de distribución `"files": ["dist", "LICENSE", "README.md", "CHANGELOG.md", "SECURITY.md"]` en `package.json` para excluir código fuente sin compilar y suites de prueba del paquete publicado.
  - Hook `"prepublishOnly": "npm run build && npm test"` y metadatos `repository`, `homepage`, `bugs` y `engines` (`node >= 20.0.0`) requeridos por NPM Provenance.
  - Pasos de auditoría de seguridad (`npm audit --audit-level=high`) y validación de tarball (`npm pack --dry-run`) en el pipeline de CI.

## [2.2.1] - 2026-11-08

### Added
- **Protección del Proyecto y Gobernanza**:
  - `SECURITY.md` — Política de seguridad criptográfica (procesamiento en memoria sin escritura de llaves privadas ni XML firmados en disco) y canales de reporte privado de vulnerabilidades de **LopezSoft SAS**.
  - `CONTRIBUTING.md` — Guía oficial de contribución, reglas de arquitectura SOLID, convenciones de código y flujo de ramas (`dev` → `main`).
  - `.github/CODEOWNERS` — Definición de propietarios y revisores obligatorios (`@lopezsoft`) para áreas críticas (`src/security/`, `src/ubl/`, `LICENSE`, `SECURITY.md`).
  - `.github/workflows/ci.yml` — Pipeline de Integración Continua en GitHub Actions para validar compilación (`npm run build`) y pruebas (`npm test`) en Node.js 20.x y 22.x sobre `main` y `dev`.
  - Creación de la rama de integración `dev` separada de la rama estable `main`.

### Changed
- **Licenciamiento GNU AGPLv3 (`AGPL-3.0-or-later`)**:
  - Actualizado `LICENSE` con el texto íntegro oficial de la **GNU Affero General Public License v3.0** bajo titularidad de **LopezSoft SAS** (`Lewis Lopez Gomez`).
  - Actualizado el campo `"license"` en `package.json` a `"AGPL-3.0-or-later"`.
  - Documentado el modelo de licenciamiento dual (Open Source AGPLv3 + Licencia Comercial Empresarial de LopezSoft SAS) y el flujo de ramas en `README.md`.

## [2.2.0] - 2026-11-08

### Added
- **Paridad criptográfica XAdES-EPES completa con `ubl21dian` v3.6.9 (`BaseXmlSigner`)**:
  - Inclusión de las 3 referencias obligatorias XAdES-EPES en `<ds:SignedInfo>` (`URI=""` para el documento raíz con transformación `enveloped-signature`, `URI="#...-keyinfo"` para `<ds:KeyInfo>` y `URI="#...-signedprops"` con `Type="http://uri.etsi.org/01903#SignedProperties"`).
  - Propagación de los namespaces del tipo de documento (`DOCUMENT_TYPE_CONFIG[type].ns`) hacia `<ds:KeyInfo>`, `<xades:SignedProperties>` y `<ds:SignedInfo>` antes de canonicalizar con C14N (`http://www.w3.org/TR/2001/REC-xml-c14n-20010315`).
  - Inclusión de `<xades:SignerRole><xades:ClaimedRoles><xades:ClaimedRole>supplier</xades:ClaimedRole></xades:ClaimedRoles></xades:SignerRole>`.
  - Conversión de precisión arbitraria hexadecimal a decimal mediante `hexToDecimal()` (`BigInt`) para `<ds:X509SerialNumber>`, soportando seriales de 16 a 20+ bytes (128–160 bits) de FIMA Digital, Viafirma, GSE y Andes SCD (`ubl21dian` v3.6.9).
  - Formateo de `<xades:SigningTime>` en zona horaria de Colombia (`America/Bogota`, `-05:00`) mediante `formatColombiaSigningTime()` (`ubl21dian` v3.2.11).
- **Arquitectura SOLID y Patrones de Diseño**:
  - `BaseSoapCommand` — Clase base abstracta (Patrón Template Method + Command) que centraliza la resolución de endpoints DIAN (con fallback seguro a producción `DianEndpoints[1]`, `ubl21dian` v3.6.8), firma WS-Security, envío HTTP y extracción de respuesta.
  - `XmlSignerFactory` — Fábrica desacoplada (Patrón Factory + Open/Closed Principle) para instanciar el firmante especializado según `DocumentType` o auto-detección XML.
  - Soporte de **flujo dual** en todos los comandos de envío (`SendBillSyncCommand`, `SendBillAsyncCommand`, `SendBillAttachmentAsyncCommand`, `SendEventCommand`, `SendNominaSyncCommand`): firma al vuelo (`unsigned*Xml`) o envío directo de contenido pre-firmado / ZIP en base64 (`contentFile`).
  - Segregación de interfaces (`ISoapSigner`, `IXmlSigner`, `IXmlSignerFactory`, `IXmlSignOptions`) e Inyección de Dependencias en `DianClient`.
- **Nuevas funciones en `DianExtensions`**:
  - `getQRDataDocumentSupport()` — Generación de cadena QR para Documento Soporte y Nota de Ajuste (`ubl21dian` v3.6.1).
  - `applyPreSignUblExtensions()` — Inyección opcional pre-firma de `SoftwareSecurityCode` (`SoftwareSC`), `CUFE`/`CUDE`/`CUDS`/`CUNE` y `QRCode`.
  - Soporte para Nómina de Ajuste de Eliminación sin nodos `DevengadosTotal`, `DeduccionesTotal` ni `ComprobanteTotal` (`ubl21dian` v3.5.1).

### Fixed
- **Prevención de Error DIAN `FAD06` (`DianExtensions`)**:
  - Aplicación de `truncateDecimals(..., 2)` sobre `LineExtensionAmount`, `TaxAmount` y `PayableAmount` en el cálculo de `CUFE`, `CUDE` y `CUDS` (`ubl21dian` v3.6.0–v3.6.5).
  - Filtrado de `<cac:TaxTotal>` exclusivamente a nivel raíz del documento para ignorar impuestos de línea en `<cac:InvoiceLine>`.
- **`BaseXmlSigner` — Eliminación de doble firmado legacy y corrección de `CertDigest`**:
  - Cálculo de `<xades:CertDigest>` sobre los bytes DER del certificado X.509 completo en lugar de la llave pública.
  - Ejecución de la firma XAdES-EPES en una sola pasada DOM sin doble firmado RSA.
  - Resolución dinámica de `ExtensionContent` para `AttachedDocument` (índice `0`), Sector Salud / Minsalud (`CustomTagGeneral`, índice `2`) y Nómina con 1 o 2 extensiones.
- **`SoapSigner` — Canonicalización Exclusiva e IDs por petición**:
  - Inclusión de `{ inclusiveNamespacesPrefixList: 'wsa soap wcf' }` al canonicalizar `<ds:SignedInfo>` en `createSignature()`.
  - Regeneración limpia de identificadores `wsu:Id` / `Id` en cada invocación de `sign()`.
- **`Certificate` — Soporte PKCS#12 extendido**:
  - Extracción de llaves privadas tanto desde `pkcs8ShroudedKeyBag` como `keyBag` y detección normalizada de errores MAC / contraseña inválida en `node-forge`.

### Removed
- Archivo vacío residual `src/soap/SoapMessage.ts`.
- Funciones legacy sin uso `getDomTag`, `getDomQuery` y `x509Export` en `src/common/utils.ts`.

## [2.1.2] - 2026-03-25

### Removed
- Eliminados todos los archivos PHP del proyecto original (`src/Client.php`, `src/Sign.php`, `src/BinarySecurityToken/`, `src/Templates/`, `src/Traits/`, `src/XAdES/`, `tests/*.php`) — el proyecto PHP de referencia se conserva localmente en `ubl21dian/` (excluido vía `.gitignore`)

## [2.1.1] - 2026-03-25

### Added
- Archivo `LICENSE` con texto completo de la licencia MIT (Copyright 2026 Lewis Lopez Gomez)

## [2.1.0] - 2026-03-25

### Security
- **`xmldom` → `@xmldom/xmldom` ^0.9.8** — Migrado del paquete abandonado `xmldom` al fork mantenido. Resuelve 2 vulnerabilidades críticas (múltiples nodos raíz, malinterpretación de XML malicioso)
- **`fast-xml-parser` 4.x → 5.x** — Actualizado a v5.5.9. Resuelve 5 CVEs críticos (entity expansion DoS, regex injection, stack overflow)
- **`node-forge` 1.3.1 → 1.4.0** — Resuelve 3 vulnerabilidades altas (ASN.1 recursion, OID truncation, validator desync)
- **`axios` 1.11.0 → 1.13.6** — Resuelve 2 vulnerabilidades altas (DoS, prototype pollution)
- **Dependencias transitivas** — `js-yaml`, `minimatch`, `picomatch` actualizadas vía `npm audit fix`
- **0 vulnerabilidades** en `npm audit` post-actualización

### Changed
- Eliminado `@types/xmldom` (innecesario, `@xmldom/xmldom` incluye tipos propios)
- Actualizado `@types/node-forge` a ^1.3.14
- Actualizado `ts-jest` a ^29.4.6
- Adaptados tipos DOM en `DianExtensions.ts`, `models.ts`, `utils.ts` para compatibilidad con `@xmldom/xmldom` v0.9
- Corregido XML de test con namespace `xmlns:cbc` faltante (requerido por parser más estricto de @xmldom v0.9)

## [2.0.0] - 2026-03-25

### Added

#### Firma XAdES por Tipo de Documento
- `XmlSigner` — Firma XAdES para Invoice, CreditNote, DebitNote, Event con namespaces auto-detectados
- `PayrollSigner` — Firma XAdES para NominaIndividual y NominaIndividualDeAjuste con workaround de namespace `xmlns:sts`
- `AttachedDocumentSigner` — Firma XAdES para AttachedDocument (documento adjunto)
- `DocumentSupportSigner` — Firma XAdES para DocumentoSoporte con `xmlns:sts` URN
- `AdjustmentNoteSigner` — Firma XAdES para NotaAjuste con `xmlns:sts` URL
- `BaseXmlSigner` — Clase base Template Method con hooks para especialización

#### Cálculos Hash DIAN
- `calculateCufe()` — CUFE SHA384 para facturas electrónicas
- `calculateCude()` — CUDE SHA384 para notas crédito/débito
- `calculateCuds()` — CUDS SHA384 para documento soporte
- `calculateCune()` — CUNE SHA384 para nómina electrónica
- `calculateCudeEvent()` — CUDE-Event SHA384 para eventos (ApplicationResponse)
- `softwareSecurityCode()` — SHA384 del código de seguridad del software
- `injectUuid()`, `injectCune()`, `injectCudeEvent()` — Inyección de UUID en XML

#### QR Code Data
- `getQRDataInvoice()` — Generación de string QR para facturas
- `getQRDataPayroll()` — Generación de string QR para nómina

#### Comandos SOAP (14 operaciones completas)
- `SendBillAttachmentAsyncCommand` — Envío asíncrono de documentos adjuntos
- `GetStatusEventCommand` — Consulta de estado de eventos
- Corrección de `SendTestSetAsyncCommand` (reimplementado desde cero)
- Corrección de `SendBillAsyncCommand` (argumentos invertidos)

#### Configuración por Tipo de Documento
- `DOCUMENT_TYPE_CONFIG` — 9 tipos de documento con namespaces, XPath y configuración auto-detectada
- `detectDocumentType()` / `detectDocumentTypeFromDom()` — Detección automática del tipo de documento desde XML

#### Soporte Multi-Algoritmo
- `ISignatureAlgorithm` — Interfaz para SHA256 y SHA512 (SHA1 deprecado en xml-crypto v6)
- `setAlgorithm()` en `BaseXmlSigner`

#### Tests (217 tests en 8 suites)
- `tests/soap/templates.test.ts` — 32 tests de templates SOAP
- `tests/security/Certificate.test.ts` — 3 tests de certificados
- `tests/ubl/DianExtensions.test.ts` — 83 tests de extensiones DIAN (CUFE, CUDE, CUDS, CUNE, QR, SSC)
- `tests/security/SoapSigner.test.ts` — 23 tests de firma SOAP WS-Security
- `tests/security/XAdES.test.ts` — 27 tests de firma XAdES UBL
- `tests/security/PayrollSigner.test.ts` — 26 tests de firma nómina y signers especializados
- `tests/commands/Commands.test.ts` — 19 tests de comandos
- `tests/e2e/DianClient.e2e.test.ts` — 7 tests E2E con mock HTTP

### Fixed
- **C14N Algorithm** — XAdES corregido de Exc-C14N (`xml-exc-c14n#`) a C14N estándar (`xml-c14n-20010315`) para paridad con PHP
- **SendTestSetAsyncCommand** — Reimplementado (era copia de SendNominaSyncCommand)
- **SendBillAsyncCommand** — Argumentos `action`/`toValue` invertidos en `sign()`
- **SoapSigner debug files** — Eliminados 3 `fs.writeFileSync` que escribían XML firmados al disco
- **Certificate.test.ts** — Actualizado para API actual de `Certificate`
- **GetExchangeEmailsCommand** — Tipo genérico corregido
- **Response path parsing** — Unificado sin prefijo de namespace
- **fast-xml-parser** — Configurado `numberParseOptions` para evitar conversión `"00"` → `0`

### Changed
- `package.json` version bump de 1.1.1 a 2.0.0
- `DianExtensions.ts` — De archivo vacío a 620+ líneas con toda la lógica DIAN
- `models.ts` — De archivo vacío a 200+ líneas con 9 tipos de documento y detección
- `README.md` — Reescrito con ejemplos correctos de API, imports y uso de nómina

### Removed
- Dependencia `xml2js` no utilizada
- Script `start:dev` vestigial de NestJS
- Interfaces duplicadas en `interfaces.ts`
- Casts `as any` innecesarios en `DianClient.ts`

## [1.1.1] - 2026-03-20

### Added
- Estructura inicial del SDK con comandos SOAP básicos
- `SoapSigner` para firma WS-Security
- `XmlSigner` con firma XAdES básica (sin CUFE/CUDE)
- `PayrollSigner` para firma de nómina básica
- 15 templates SOAP para operaciones DIAN
- `Certificate` para manejo de certificados P12/PFX
- `DianClient` como facade principal
- `SoapClient` para comunicación HTTP con la DIAN
