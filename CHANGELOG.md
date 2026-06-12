# Changelog

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
