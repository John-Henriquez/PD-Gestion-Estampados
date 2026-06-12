# Changelog

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