# Guía de Contribución (`CONTRIBUTING.md`)

¡Gracias por tu interés en contribuir a **DIAN SDK Node**! Este proyecto implementa el estándar de facturación electrónica UBL 2.1, Documento Soporte, Eventos RADIAN y Nómina Electrónica de la DIAN en Colombia para Node.js y TypeScript.

---

## 1. Flujo de Ramas (`Git Flow` Simplificado)

El repositorio cuenta con dos ramas principales protegidas:

- **`main`**: Rama estable de producción. Contiene únicamente versiones liberadas y etiquetadas (`vX.Y.Z`). No se permiten commits directos.
- **`dev`**: Rama principal de integración y desarrollo continuo. Toda nueva funcionalidad, mejora o corrección debe partir de `dev` y fusionarse hacia `dev` mediante *Pull Request*.

### Pasos para proponer un cambio:
1. Crea tu rama desde `dev`:
   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feat/nombre-descriptivo
   ```
2. Realiza tus cambios siguiendo los estándares de arquitectura descritos abajo.
3. Ejecuta la compilación y la suite completa de pruebas:
   ```bash
   npm run build
   npm test
   ```
4. Usa **Conventional Commits** (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`).
5. Abre un *Pull Request* apuntando a la rama `dev`.

---

## 2. Reglas de Arquitectura y Código

- **Principios SOLID y Patrones de Diseño**:
  - Todo nuevo comando SOAP debe heredar de `BaseSoapCommand<TParams, TResponse>`.
  - Todo nuevo firmante XML debe extender `BaseXmlSigner` y registrarse en `XmlSignerFactory`.
- **Idioma del Código**:
  - Todos los identificadores técnicos (clases, métodos, variables, propiedades, interfaces, tipos y constantes) **deben estar en inglés**.
  - Los comentarios explicativos, bloques JSDoc y mensajes de error visibles **deben estar en español**.
- **Calidad y Pruebas**:
  - Todo cambio en reglas de negocio DIAN (`DianExtensions`, `BaseXmlSigner`, `SoapSigner`, comandos SOAP) debe incluir pruebas unitarias en `tests/`.
  - Ningún test ni componente debe escribir archivos temporales o XML firmados en disco.

---

## 3. Licencia y Derechos de Autor (GNU AGPLv3)

Al enviar una contribución (*Pull Request*) a este repositorio, aceptas que tu código se distribuya bajo los términos de la licencia **GNU Affero General Public License v3.0 (`AGPL-3.0-or-later`)** y autorizas a **LopezSoft SAS** a incluirlo tanto en la distribución de código abierto como en sus modalidades de licenciamiento comercial empresarial.
