# Política de Seguridad (`SECURITY.md`)

## Versiones Soportadas

Actualmente se brinda soporte de actualizaciones de seguridad a las siguientes versiones de **DIAN SDK Node**:

| Versión | Soportada |
| :--- | :---: |
| `2.2.x` | ✅ |
| `< 2.2.0` | ❌ |

---

## Principios de Seguridad Criptográfica y Operacional

Este SDK manipula material criptográfico sensible (certificados digitales PKCS#12 `.p12`/`.pfx`, llaves privadas RSA y documentos tributarios UBL 2.1 / Nómina Electrónica). Cualquier contribución o uso debe preservar las siguientes garantías de *Security by Design*:

1. **Procesamiento 100 % en Memoria**:
   - Las llaves privadas (`privateKeyPem`), certificados (`certificatePem` / `certificateDer`) y documentos XML firmados jamás deben escribirse en archivos temporales ni en disco durante las operaciones de firma (`BaseXmlSigner`, `SoapSigner`, `Certificate`).
2. **Prohibición de Exposición de Secretos en Logs**:
   - Nunca registrar contraseñas de certificados, PIN de software, claves técnicas (`technicalKey`), contenido de llaves privadas ni payloads SOAP firmados en salidas de consola o trazas de error.
3. **Integridad Criptográfica XAdES-EPES y WS-Security**:
   - Se prohíbe el uso de algoritmos débiles o deprecados (como SHA-1 / MD5) en la firma de documentos electrónicos. Solo se admiten `RSA-SHA256` y `RSA-SHA512` para XAdES-EPES y `SHA-384` para cálculos de identificadores tributarios (`CUFE`, `CUDE`, `CUDS`, `CUNE`, `SoftwareSecurityCode`).
4. **Dependencias Seguras**:
   - Se utiliza `@xmldom/xmldom` y `fast-xml-parser` actualizados para mitigar ataques de expansión de entidades XML (XXE / DoS) y contaminación de prototipos.

---

## Reporte de Vulnerabilidades

Si descubres una vulnerabilidad de seguridad en este proyecto, **por favor NO abras un Issue público en GitHub**.

Envía tu reporte de forma privada a través de cualquiera de los siguientes canales oficiales de **LopezSoft SAS**:

- **Correo corporativo**: [gerencia@lopezsoft.net.co](mailto:gerencia@lopezsoft.net.co)
- **Contacto directo del autor**: [contact@lewislopez.io](mailto:contact@lewislopez.io)

Incluye en tu reporte:
1. Descripción detallada de la vulnerabilidad y el componente afectado (`src/security/`, `src/ubl/`, `src/soap/`, etc.).
2. Pasos para reproducir el problema o prueba de concepto (PoC) sin incluir certificados reales de producción.
3. Impacto potencial estimado.

Recibirás acuse de recibo en un plazo máximo de **48 horas hábiles** y coordinaremos la publicación del parche de seguridad antes de cualquier divulgación pública.
