# Changelog

## [1.0.5] — Revisión de la capa de controladores

### Backend · `src/controllers`

#### `auth.controller.js`

##### Corregido

* Cookie JWT sin `secure` ni `sameSite` — vulnerable en producción. Ambas opciones ahora condicionadas a `NODE_ENV === "production"`, consistente con la corrección aplicada en `index.js`.
* `logout` usaba opciones distintas a las de `login` en `clearCookie` — el navegador no eliminaba la cookie. Opciones unificadas.
* Token JWT expuesto en el body de respuesta además de en la cookie. Eliminado del body — un solo mecanismo de transporte.

---

#### `payment.controller.js`

##### Corregido

* `"use strict"` faltante.
* Respuestas directas `res.status().json()` reemplazadas por `handleSuccess` y `handleErrorServer` en todas las funciones, unificando el formato de respuesta con el resto de la API.
* `verifyPayment`: `req.user?.id || 1` como fallback asignaba al administrador como responsable cuando no había usuario autenticado, contaminando la auditoría. Cambiado a `|| null`.
* `receiveWebhook`: `adminUserId` hardcodeado como `1`. Cambiado a `null` — los webhooks son eventos del sistema, no de un usuario.
* `receiveWebhook`: sin validación de firma MercadoPago — cualquier agente podía hacer POST al endpoint y marcar órdenes como pagadas. Agregada validación HMAC-SHA256 con header `x-signature`.
* `createPreference`: `handleErrorServer` inalcanzable después de un `return`. Eliminado.
* `import` statements dentro de función arrow — sintaxis inválida en ES modules. Movidos al tope del archivo.

---

#### `order.controller.js`

##### Corregido

* `getAllOrders`: `userId` declarado pero nunca utilizado. Eliminado.
* `getOrderById`: cuarto parámetro `userEmailForGuestCheck` no se pasaba al servicio — pedidos de invitados eran inaccesibles para sus propios creadores. Corregido leyendo `guestEmail` desde `req.body` o `req.query`.

##### Deuda técnica documentada

* Detección de tipo de error por `string.includes()` en tres funciones. Requiere refactorización del patrón de error en servicios hacia objetos estructurados con `code`.

---

#### `itemStock.controller.js`

##### Corregido

* `"use strict"` faltante.
* `deleteItemStock`: `result.message` era `undefined` — el servicio devuelve `{ id }` sin `message`. Reemplazado por mensaje estático.
* `emptyTrash`: mensaje informativo de ítems en uso tratado como error con código 500. Ahora distingue entre error real (`deletedCount === null`) y mensaje informativo, devolviendo 200 en ambos casos.
* `restockVariants`: normalizaba `restockData` a array en `dataToProcess` pero pasaba el original sin normalizar al servicio. Corregido para usar `dataToProcess`.

---

#### `pack.controller.js`

Sin cambios — aprobado.

---

#### `user.controller.js`

##### Corregido

* `getUsers`: devolvía HTTP 204 cuando no hay usuarios — HTTP 204 no permite body. Cambiado a 200 con array vacío.
* `deleteUser`: typo en mensaje de error "Error eliminado al usuario" → "Error eliminando al usuario".

---

#### `inventoryMovement.controller.js`

##### Corregido

* Filtro `operationSlug` disponible en el servicio pero no leído desde `req.query`. Agregado al objeto `filters`.

---

#### `report.controller.js`

##### Corregido

* Bloques `catch` con mensaje genérico que perdían el error real. Reemplazados por `handleErrorServer(res, 500, error.message)`.

---

#### `itemType.controller.js`

##### Corregido

* `"use strict"` faltante.
* `updateItemType`: `newImageUrls` declarado como `const` e inmediatamente reasignado — `TypeError` en runtime. Cambiado a `let`. Agregado bloque de lectura de `req.files` faltante que hacía que las nuevas imágenes nunca se agregaran en actualizaciones.
* `emptyTrash`: `userId` no se pasaba al servicio cuya firma requiere `emptyTrash(userId)`.
* `deleteItemType`: `userId` no se pasaba al servicio cuya firma requiere `deleteItemType(id, userId)`.
* Eliminados más de 15 `console.log` de debug que se ejecutaban en producción.

---

#### `file.controller.js`

##### Corregido

* `"use strict"` faltante.
* Typo de sintaxis en `renameFile`: guión suelto (`-`) después de la llave de apertura del `catch` — rompía el archivo completo.

---

#### `geography.controller.js`

##### Corregido

* Respuestas directas `res.json()` y `res.status().json()` reemplazadas por `handleSuccess` y `handleErrorServer`, unificando el formato con el resto de la API.
* `getComunasByRegion`: `regionId` no se validaba antes de hacer la query — consultas con `NaN` llegaban a la base de datos. Agregada validación de tipo numérico.
 
---

#### `color.controller.js` · `upload.controller.js`

Sin cambios — aprobados.

## [1.0.4] — Revisión de la capa de servicios

### Backend · `src/services`

#### `auth.service.js`

##### Corregido

* `createErrorMessage` estaba redefinido como función interna en cada función del módulo. Extraído al tope del archivo como helper de módulo.
* El payload del JWT no incluía el `id` del usuario, obligando a queries adicionales a la base de datos en otros módulos para identificar al usuario autenticado.
* `registerService` hacía dos queries separadas para verificar duplicado de `email` y `rut`. Unificado en una sola query con `where: [{ email }, { rut }]`.

---

#### `user.service.js`

##### Corregido

* `updateUserService` asignaba `updatedAt: new Date()` manualmente — TypeORM ya gestiona este campo con `updateDate: true`. Línea eliminada.
* `updateUserService` usaba `userRepository.update()` seguido de `findOne()` — dos queries cuando `save()` devuelve la entidad actualizada directamente.
* `deleteUserService` tenía el guard de administrador comentado — protección crítica desactivada que permitía eliminar al único administrador del sistema. Restaurado.
* `getUserService` construía `where: [{ id }, { rut }, { email }]` sin filtrar `undefined`, causando que TypeORM buscase registros con campos `IS NULL` cuando los parámetros no se proveían.

---

#### `order.service.js`

##### Corregido

* `"use strict"` faltante.
* `order.updatedAt = new Date()` en `updateOrderStatus` eliminado — TypeORM gestiona el campo automáticamente.
* Filtro de stock activo cambiado de `stockItem.isActive` a `stockItem.deletedAt !== null`, consistente con el mecanismo de soft delete definido en la entidad.
* `createOrder`: el `Map` de stock a actualizar almacenaba solo la cantidad, requiriendo una query adicional por cada item para obtener el snapshot. Refactorizado para almacenar `{ qty, snapshot }` — la query extra eliminada.
* El patrón del `Map` se aplicó también al loop de items de packs para consistencia y para evitar tipos mezclados cuando un item aparece en ambos contextos.
* `quantity: 0` en el movimiento de auditoría de `updateOrderStatus` violaba `CHK_MOVEMENT_QUANTITY`. Cambiado a `quantity: 1` como workaround documentado hasta implementar tabla de auditoría de pedidos separada.

##### Deuda técnica documentada

* Los movimientos de cambio de estado de pedido se registran en `InventoryMovement`, mezclando auditoría de pedidos con trazabilidad de stock. Se recomienda una tabla `order_history` dedicada en una iteración futura.

---

#### `payment.service.js`

##### Corregido

* `"use strict"` faltante.
* URL de ngrok hardcodeada en dos lugares: `returnUrl` y `notification_url`. Reemplazadas por `FRONTEND_URL` y nueva variable `BACKEND_URL` desde `configEnv.js`.

---

#### `itemType.service.js`

##### Corregido

* `"use strict"` faltante.
* `forceDeleteItemType`: `operationRepo` se declaraba usando `queryRunner.manager` antes de que `queryRunner` existiera. Movido al bloque `try` junto al resto de repos.
* `forceDeleteItemType`: faltaban `commitTransaction()` antes del return y `queryRunner.release()` en el bloque `finally`.
* `restoreItemType`: `commitTransaction()` estaba después del `return` — la transacción nunca se confirmaba. Corregido el orden.
* `restoreItemType`: faltaba `rollbackTransaction()` en el bloque `catch`.
* `emptyTrash`: usaba variables `meta` y `operationRepo` no declaradas en ese scope. Corregido declarando ambas correctamente.
* `emptyTrash`: usaba campos de snapshot inexistentes (`itemName`, `itemColor`, `itemTypeName`). Reemplazado por `createItemSnapshot()`.
* `deleteItemType` y `restoreItemType`: `quantity: 0` en movimientos de auditoría violaba `CHK_MOVEMENT_QUANTITY`. Cambiado a `quantity: 1`.

---

#### `itemStock.service.js`

##### Corregido

* `"use strict"` faltante.
* `deleteItemStock`, `restoreItemStock`, `forceDeleteItemStock` y `emptyTrash`: `quantity: 0` en movimientos violaba `CHK_MOVEMENT_QUANTITY`. Cambiado a `quantity: 1` en todos.
* `adjustStock`: `throw new Error` dentro de la transacción para stock negativo reemplazado por `return [null, mensaje]` para que la transacción termine limpiamente.

---

#### `pack.service.js`

##### Corregido

* `"use strict"` faltante.
* `emptyTrash`: pasaba el slug string `operation` directamente al movimiento en lugar de la entidad buscada. Corregido usando `operationEntity`.
* `emptyTrash` y `forceDeletePack`: `quantity: 0` cuando el pack no tiene items. Agregado fallback `totalQuantity > 0 ? totalQuantity : 1`.
* `updatePack`: `quantity: 0` en movimiento de auditoría. Cambiado a `quantity: 1`.
* `deletePack`: `quantity: 0` en movimiento. Cambiado a `quantity: 1`.

##### Deuda técnica documentada

* `deletePack`, `restorePack` y `forceDeletePack` no usan transacciones. Si el guardado del movimiento falla después del guardado del pack, el estado queda inconsistente sin auditoría.

---

#### `report.service.js`

##### Corregido

* `orderItemRepository` declarado pero nunca utilizado. Eliminado.
* `totalCustomers` filtraba por `rol: "cliente"` — valor que no existe en el sistema (los roles son `"administrador"` y `"usuario"`). La query siempre devolvía 0. Corregido a `rol: "usuario"`.
* `getInventoryLossReport` filtraba `movement.type = 'Salida'` con mayúscula inicial, no coincidiendo con los valores del enum (`"salida"`). La query nunca devolvía resultados. Corregido a minúscula.

##### Deuda técnica documentada

* `salesHistoryTransactions` se calcula pero no se incluye en el objeto de retorno — código muerto. Pendiente de eliminar o exponer según necesidad del frontend.

---

#### `email.service.js`

##### Corregido

* `"use strict"` faltante.
* `process.env.VITE_BASE_URL` accedido directamente en las plantillas HTML. Reemplazado por `FRONTEND_URL` importado desde `configEnv.js`, consistente con el resto del sistema.

##### Agregado

* `sendEmail` exportada para permitir uso desde otros módulos sin duplicar lógica.

---

#### `inventoryMovement.service.js`

##### Corregido

* `"use strict"` faltante.

##### Agregado

* Relación `"pack"` agregada a las relaciones cargadas en `getInventoryMovements` — movimientos asociados a packs no cargaban su referencia.

## [1.0.3] — Revisión de handlers, validaciones y documentación

### Backend · `src/handlers`

#### `responseHandlers.js`

Sin cambios — estructura aprobada. Patrón de respuesta uniforme en los tres casos (`handleSuccess`, `handleErrorClient`, `handleErrorServer`).

---

### Backend · `src/validations`

#### `auth.validation.js`

##### Corregido

* Eliminado `domainEmailValidator` personalizado — redundante con la validación nativa `.email()` de Joi.
* `password`: corregido `min(7)` a `min(8)` para que coincida con el mensaje de error que ya indicaba "al menos 8 caracteres".
* Mensajes de `string.email` corregidos: decían `"debe finalizar en @gmail.cl"` pero la validación acepta cualquier dominio válido — reemplazado por mensaje genérico.

#### `user.validation.js`

##### Corregido

* Mismas correcciones de `domainEmailValidator` y mensajes de email que en `auth.validation.js`.
* `newPassword`: resuelto conflicto entre `.allow("")` y el patrón `/^[a-zA-Z0-9]+$/` — el patrón rechaza strings vacíos, contradiciendo el `allow("")`. Campo marcado como `.optional()` con patrón aplicado solo cuando el valor está presente.
* `rol` en `userBodyValidation`: cambiado de `Joi.string().min(4).max(15)` (acepta cualquier string) a `Joi.string().valid("administrador", "usuario")` — consistente con el check constraint agregado en `user.entity.js`.

#### `itemStock.validation.js`

##### Corregido

* Agregado `"use strict"` faltante.
* `singleItemSchema`: cambiado `.unknown(true)` a `.unknown(false)` — permitir propiedades arbitrarias contradice el propósito de validar la entrada.
* `quantity` en creación: corregido `min(0)` a `min(1)` — no tiene sentido crear un registro de stock con 0 unidades. En el schema de actualización se conserva `min(0)` para permitir ajustes manuales.

#### `itemType.validation.js`

##### Corregido

* Agregado `"use strict"` faltante.
* `productImageUrls`: eliminado `\s` del patrón de validación — nombres de archivo con espacios producen URLs inválidas sin encoding.
* `stampingLevelsSchema`: eliminado `.min(0).optional()` redundante — si el array es opcional, `min(0)` no agrega restricción útil.

#### `order.validation.js`

##### Agregado

* `stampImageUrl`: agregado patrón `/^\/uploads\/[a-zA-Z0-9_.\-]+\.[a-zA-Z0-9]{2,5}$/` — consistente con la validación de `productImageUrls` en `itemType.validation.js`.

---

### Documentación

#### `README.md` _(reescrito)_

##### Eliminado

* Contenido legacy que describía el proyecto como "módulo inicial de autenticación en progreso" — descripción que no representaba el estado real ni la complejidad del sistema.

##### Agregado

* Descripción del problema de negocio que resuelve el sistema.
* Tabla de stack tecnológico completa (React, Vite, Node.js, Express, TypeORM, PostgreSQL, MercadoPago, Docker, Joi, Nodemailer).
* Sección de funcionalidades organizada por dominio: panel administrativo, tienda y sistema.
* Estructura de carpetas resumida con descripción de cada módulo.
* Instrucciones de instalación con Docker (recomendado) y sin Docker.
* Tabla de variables de entorno completa basada en `configEnv.js`.
* Resumen de endpoints de la API por módulo.
* Placeholder para screenshots.

## [1.0.2] — Revisión de middlewares
 
### Backend · `src/middlewares`
 
#### `authentication.middleware.js`
 
##### Corregido
 
* Agregado `"use strict"` faltante.
---
 
#### `authorization.middleware.js`
 
##### Corregido
 
* Agregado `"use strict"` faltante.
* Se eliminó una query innecesaria a la base de datos para obtener el rol del usuario. El rol ya está disponible en `req.user` desde el JWT — hacer un `findOneBy` por cada request protegido era un hit de base de datos completamente evitable.
* La función pasó de `async` a síncrona al no requerir operaciones asíncronas.
---
 
#### `permission.middleware.js`
 
##### Corregido
 
* Agregado `"use strict"` faltante.
* Se eliminó la importación de `getSolicitudService` desde `solicitud.service.js`, archivo que no existe en este proyecto — era código residual de otro sistema.
##### Refactorizado
 
* El middleware fue reimplementado como `verifyOrderOwnership`, adaptado al dominio del proyecto. Verifica que el usuario autenticado sea el propietario del pedido solicitado, o que tenga rol de administrador.
---
 
#### `uploadMiddleware.js`
 
##### Corregido
 
* Agregado `"use strict"` faltante.
* Eliminado `image/svg+xml` de los tipos MIME permitidos — los archivos SVG pueden contener scripts ejecutables y representan un vector de XSS si se sirven directamente.
* El nombre del archivo guardado dejó de derivarse del nombre original del cliente. Ahora se genera completamente en el servidor (`upload-{timestamp}-{random}{ext}`), eliminando el riesgo de path traversal y nombres maliciosos.
##### Agregado
 
* Validación de extensión de archivo además del tipo MIME — el mimetype puede ser falsificado por el cliente; la extensión agrega una segunda capa de verificación.

# [1.0.1] — Revisión de entidades restantes

## Backend · `src/entity`

### `stampingLevel.entity.js`

#### Corregido

* Agregado `"use strict"` faltante.

#### Agregado

* Timestamps `createdAt` y `updatedAt` (`timestamp with time zone`) para trazabilidad de cambios de precio.
* Índice `IDX_STAMPING_LEVEL_ACTIVE` sobre `isActive`.
* Constraint `CHK_STAMPING_LEVEL_PRICE` para garantizar `price >= 0`.

---

### `color.entity.js`

#### Corregido

* Agregado `"use strict"` faltante.

#### Agregado

* Constraint `CHK_COLOR_HEX` con regex `^#[0-9A-Fa-f]{6}$` para evitar almacenar valores inválidos como `"rojo"` o `"#GGGGGG"`.

---

### `orderStatus.entity.js`

#### Corregido

* Agregado `"use strict"` faltante.

#### Agregado

* Constraint `CHK_ORDER_STATUS_NAME` que restringe `name` al conjunto cerrado de estados soportados:

  * `pendiente_de_pago`
  * `en_proceso`
  * `enviado`
  * `completado`
  * `cancelado`

  Esto evita estados no contemplados que podrían romper la lógica del frontend encargada de mapear etiquetas y colores.

---

### `inventoryOperation.entity.js`

#### Corregido

* Definidos `nullable: false` en `slug`, `name` y `type`, evitando registros incompletos.

#### Agregado

* Índice `IDX_INVENTORY_OP_TYPE` sobre `type`, utilizado frecuentemente para filtrar movimientos.
* Timestamp `createdAt` (`timestamp with time zone`).

---

### `comuna.entity.js`

#### Corregido

* Agregado `"use strict"` faltante.
* Definido `nullable: false` en `name`.
* Configurada la relación `region` con:

  * `nullable: false`, ya que toda comuna debe pertenecer a una región.
  * `onDelete: "RESTRICT"`, evitando eliminar regiones con comunas asociadas.

#### Agregado

* Índice `IDX_COMUNA_REGION` sobre `region_id`.
* Índice `IDX_COMUNA_ZONE` sobre `zone`.
* Constraint `CHK_COMUNA_SHIPPING` para garantizar `baseShippingPrice >= 0`.
* Constraint `CHK_COMUNA_ZONE` que restringe `zone` a los valores definidos en `shippingData.js`:

  * `LOCAL`
  * `SUR_CERCANO`
  * `CENTRO`
  * `NORTE`
  * `SUR`
  * `NORTE_EXTREMO`
  * `SUR_EXTREMO`

---

### `InventoryMovementSchema.js`

#### Corregido

* Campo `changes` migrado de `json` a `jsonb`, habilitando índices GIN y consultas por campos en PostgreSQL.
* Campo `createdAt` unificado a `timestamp with time zone` usando `createDate: true`, eliminando el valor por defecto redundante.
* `onDelete: "SET NULL"` en `createdBy` movido al nivel de la relación, ya que estaba definido dentro de `joinColumn` y era ignorado por TypeORM.
* Agregado `onDelete: "RESTRICT"` en `operation` para impedir la eliminación de operaciones con movimientos asociados.
* Eliminados `updatedAt` y `deletedAt`, dado que los movimientos de inventario son registros de auditoría inmutables. Las correcciones deben realizarse mediante movimientos compensatorios y no modificando registros existentes.

#### Agregado

* Índices sobre `item_stock_id`, `operation_id` y `order_id` para optimizar consultas sobre claves foráneas.
* Constraint `CHK_MOVEMENT_QUANTITY` para garantizar `quantity != 0`.

---

### `packItem.entity.js`

#### Corregido

* Configurado `onDelete: "CASCADE"` en `pack`, asegurando la eliminación de sus ítems asociados.
* Configurado `onDelete: "RESTRICT"` en `itemStock`, evitando eliminar stock referenciado por packs activos.
* Reemplazado `stampingLevel` basado en texto libre por una relación `many-to-one` hacia `StampingLevel`, garantizando integridad referencial.

#### Agregado

* Valor por defecto `1` para `quantity`.
* Índices sobre `pack_id` e `item_stock_id`.
* Constraint `CHK_PACKITEM_QUANTITY` para garantizar `quantity > 0`.

---

### `region.entity.js`

#### Corregido

* Agregado `"use strict"` faltante.
* Definido `nullable: false` en `name`.

#### Agregado

* Índice único `IDX_REGION_NAME` sobre `name`, incorporado explícitamente para mantener consistencia con el resto de las entidades.


## [1.0.0] — Refactorización Base del Backend

### Backend · `src/config`

#### `configEnv.js`

##### Corregido

* Se corrigió el orden de ejecución: la validación de variables de entorno ahora ocurre antes de las exportaciones, evitando que módulos dependientes reciban valores `undefined` silenciosamente.
* Se eliminó la exposición de información sensible en logs mediante la eliminación de dos `console.log` de configuración.
* Se eliminaron las variables `_filename` y `_dirname`, que estaban declaradas pero nunca se utilizaban.

##### Agregado

* Validación obligatoria al inicio de la aplicación para las siguientes variables:

  * `DB_USERNAME`
  * `PASSWORD`
  * `DATABASE`
  * `ACCESS_TOKEN_SECRET`
  * `cookieKey`
  * `ADMIN_EMAIL`
  * `ADMIN_PASSWORD`

  Si alguna de ellas no está definida, el proceso finaliza con un error descriptivo.

* Exportación de `NODE_ENV` con valor por defecto `"development"`.

* Exportación de:

  * `ADMIN_EMAIL`
  * `ADMIN_PASSWORD`
  * `ADMIN_RUT`

  para su utilización en `initialSetup.js`.

---

#### `configDb.js`

##### Corregido

* `synchronize` pasó de `true` fijo a:

  ```js
  NODE_ENV !== "production"
  ```

  Esto evita que TypeORM modifique o elimine estructuras de base de datos en entornos productivos.

* `logging` pasó de `false` fijo a:

  ```js
  NODE_ENV === "development"
  ```

  habilitando logs únicamente durante el desarrollo.

##### Mejorado

* Se eliminaron interpolaciones de template strings innecesarias en:

  * `host`
  * `username`
  * `password`
  * `database`

##### Agregado

* Importación de `NODE_ENV` desde `configEnv.js`.

---

### Backend · `src/setup`

#### `initialSetup.js`

##### Corregido

* Las credenciales del administrador dejaron de estar hardcodeadas (`notificaciones.vibraes@gmail.com` / `admin123`) y ahora se obtienen desde:

  * `ADMIN_EMAIL`
  * `ADMIN_PASSWORD`
  * `ADMIN_RUT`

* `seedOrderStatuses` dejó de utilizar:

  ```js
  getRepository("OrderStatus")
  ```

  y ahora importa directamente la entidad correspondiente, evitando posibles fallos por nombres incorrectos.

* `seedInventoryOperations` utilizaba un parámetro `dataSource` mientras el resto del módulo trabajaba con `AppDataSource`. Se unificó el patrón para mejorar consistencia y facilitar pruebas.

* Se reemplazó:

  ```js
  ZONE_PRICES[item.zone] || 7500
  ```

  por:

  ```js
  ZONE_PRICES[item.zone] ?? 7500
  ```

  evitando que un valor válido de `0` sea reemplazado por el valor por defecto.

##### Refactorizado

* Se extrajo el patrón repetido:

  ```js
  count → if > 0 → return
  ```

  a un helper interno:

  ```js
  isEmpty(repo)
  ```

* Se eliminaron bloques `try/catch` individuales que ocultaban errores silenciosamente. Ahora las excepciones se propagan hasta `initialSetup`, donde son capturadas y relanzadas para que `setupAPI` pueda detener el arranque de forma controlada.

##### Extraído

* El objeto `ZONE_PRICES` fue movido a un nuevo archivo:

  ```txt
  src/constants/shippingData.js
  ```

---

#### `index.js`

##### Corregido

* Se eliminó una URL de ngrok hardcodeada (`ngrok-free.dev`) de la configuración CORS.

  Ahora los orígenes permitidos se obtienen desde:

  ```env
  ALLOWED_ORIGINS
  ```

  utilizando una lista separada por comas.

* El redirect de Mercado Pago en:

  ```txt
  /order-confirmation/:id
  ```

  dejó de apuntar a `localhost:5173` y ahora utiliza `FRONTEND_URL`.

* La cookie de sesión dejó de utilizar:

  ```js
  secure: false
  ```

  de forma fija.

  Ahora:

  ```js
  secure: NODE_ENV === "production"
  ```

  Además, se agregó:

  ```js
  httpOnly: true
  ```

* Se corrigió el orden de inicialización en `setupAPI`:

  * `initialSetup` ahora se ejecuta antes de `setupServer`.
  * Se garantiza que los datos base existan antes de comenzar a recibir solicitudes.

---

### Backend · `src/constants`

#### `shippingData.js` *(Nuevo)*

##### Agregado

* Nuevo archivo para centralizar el objeto `ZONE_PRICES`.
* Las tarifas de despacho quedan agrupadas junto al resto de constantes de negocio, mejorando mantenibilidad y reutilización.

---

### Backend · `src/entity`

#### `user.entity.js`

##### Corregido

* Se eliminó el índice `IDX_USER` sobre `id` — redundante con el índice de clave primaria que Postgres crea automáticamente.
* Se reemplazó `onUpdate: "CURRENT_TIMESTAMP"` (opción exclusiva de MySQL, ignorada en Postgres) por `updateDate: true`, delegando la actualización automática a TypeORM.

##### Agregado

* Índice `CHK_USER_ROL` con cláusula `WHERE` que restringe los valores de `rol` a `'administrador'` y `'usuario'`, evitando roles arbitrarios que podrían romper la lógica de autorización.

---

#### `order.entity.js`

##### Corregido

* `subtotal` y `total` ahora son `nullable: false` con `default: 0` — columnas económicas no deben admitir `NULL`.
* Los índices `IDX_ORDER_STATUS` e `IDX_ORDER_USER_ID` referenciaban nombres de relación (`"status"`, `"user"`) en lugar de los nombres reales de las columnas FK (`"status_id"`, `"user_id"`). TypeORM no creaba los índices. Corregido.
* Timestamps unificados a `timestamp with time zone` con `createDate`/`updateDate` para consistencia con el resto del sistema.

##### Agregado

* Índice `CHK_ORDER_PAYMENT_METHOD` que restringe los métodos de pago a valores conocidos: `mercadopago`, `transferencia`, `efectivo`.
* Relación `shippingComuna` hacia la entidad `Comuna` para normalizar el destino de despacho, reemplazando el campo de texto libre.
* `shippingAddress` conservado como `nullable: true` para preservar compatibilidad con registros históricos durante la transición.

---

#### `itemStock.entity.js`

##### Corregido

* `updatedBy` carecía de `onDelete: "SET NULL"` (ya presente en `createdBy`). Corregido para evitar errores de integridad referencial al eliminar usuarios.

##### Agregado

* Índices sobre `itemTypeId` y `color_id` — FKs frecuentemente consultadas que Postgres no indexa automáticamente.
* Índice sobre `isActive` para acelerar filtros de stock activo.
* `CHK_ITEM_STOCK_CONSISTENCY`: check constraint que garantiza coherencia entre `isActive` y `deletedAt`, evitando estados contradictorios como `deletedAt != NULL` con `isActive = true`.
* `CHK_ITEM_STOCK_QUANTITY`: check constraint `quantity >= 0` como última línea de defensa a nivel de base de datos.

---

#### `itemType.entity.js`

##### Corregido

* `productImageUrls` cambió de `simple-array` (CSV serializado sin índices) a `jsonb`, habilitando índices GIN y consultas por elemento en Postgres.
* Timestamps unificados a `timestamp with time zone` con `createDate`/`updateDate`.
* `createdBy` y `updatedBy` carecían de `onDelete: "SET NULL"`. Corregido en ambas relaciones.

##### Agregado

* Índices sobre `name` (unique), `category` e `isActive` para acelerar filtros y búsquedas frecuentes.

---

#### `orderItem.entity.js`

##### Corregido

* Los índices referenciaban nombres de relación (`"order"`, `"itemStock"`, `"pack"`) en lugar de los nombres reales de las columnas FK (`"order_id"`, `"item_stock_id"`, `"pack_id"`). TypeORM no creaba los índices. Corregido.
* `itemNameSnapshot` carecía de `length: 255`. Corregido.

##### Agregado

* `CHK_ORDERITEM_QUANTITY`: check constraint `quantity > 0` — un ítem de pedido siempre tiene al menos una unidad.
* `CHK_ORDERITEM_PRICE`: check constraint `priceAtTime >= 0`.

---

#### `pack.entity.js`

##### Corregido

* Timestamps unificados a `timestamp with time zone` con `createDate`/`updateDate`/`nullable`.
* `createdBy` y `updatedBy` carecían de `onDelete: "SET NULL"`. Corregido en ambas relaciones.

##### Agregado

* `CHK_PACK_DISCOUNT`: check constraint `discount BETWEEN 0 AND 1` — el descuento es un porcentaje decimal.
* `CHK_PACK_PRICE`: check constraint `price >= 0`.
* `CHK_PACK_VALIDITY`: check constraint que garantiza `validFrom <= validUntil` cuando ambos campos tienen valor, evitando rangos de fecha inválidos.
* Índice sobre `isActive` para filtros de packs disponibles.

---

_Próxima sesión: entidades restantes (`stampingLevel`, `color`, `orderStatus`, `inventoryOperation`) y middlewares._