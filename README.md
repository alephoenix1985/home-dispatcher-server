# PSF Home Server Service

**Home Server** es un microservicio diseñado para centralizar la comunicación y gestión de dispositivos IoT en el hogar. Actúa como un puente seguro y eficiente entre los dispositivos físicos (como sensores ESP8266) y la infraestructura en la nube, permitiendo la ingesta de telemetría, la configuración dinámica de servicios y la consulta de estados en tiempo real.

## Visión y Propósito

El objetivo principal de este proyecto es crear un ecosistema de hogar inteligente robusto y escalable, donde la comunicación no dependa de implementaciones *hardcodeadas* en los dispositivos, sino que sea gestionada por una capa de servicio inteligente.

Este servicio no solo almacena datos, sino que **gestiona la verdad única** del estado del hogar, permitiendo que múltiples interfaces (dashboards, aplicaciones móviles) consuman información consistente y actualizada. Además, actúa como un **orquestador de automatización**, integrándose con plataformas como Google Home Scripting para reaccionar ante eventos críticos.

## Arquitectura Técnica

Este servicio está construido sobre una arquitectura **Serverless** utilizando AWS Lambda y SST, lo que garantiza alta disponibilidad y escalabilidad automática.

*   **Ingesta de Datos**: Los dispositivos IoT envían datos a través de endpoints HTTPS seguros.
*   **Persistencia**: Utiliza MongoDB (a través del servicio `psf-db`) para almacenar telemetría y configuraciones.
*   **Configuración Dinámica**: Los parámetros operativos de los sensores (como umbrales de alerta) se gestionan desde la base de datos, permitiendo ajustes sin reprogramar el hardware.
*   **Automatización**: Se integra con Google Home Scripting para disparar acciones domóticas (ej. luces, anuncios) cuando se detectan condiciones específicas.
*   **Comunicación Asíncrona**: Se integra con AWS SQS para manejar picos de carga y desacoplar procesos.

---

## API Endpoints

El servicio expone una API RESTful a través de AWS API Gateway.

### 1. Ingesta de Telemetría (`POST /telemetry`)

Este endpoint es utilizado por los dispositivos IoT (ej. NodeMCU ESP8266) para reportar sus lecturas.

*   **Propósito**: Recibir datos de sensores, validar la información contra la configuración del servicio, actualizar el estado en la base de datos y disparar automatizaciones si es necesario.
*   **Lógica**:
    1.  Recibe la lectura del sensor (ej. distancia en cm).
    2.  Consulta la configuración del servicio (`food_sensor`) para obtener el umbral de alerta (`ALERT_DISTANCE`).
    3.  Calcula el estado (ej. `is_empty`) basándose en la lectura y el umbral.
    4.  Realiza un `upsert` en la colección `sensor_telemetry` para mantener el último estado conocido.
    5.  **Trigger de Automatización**: Si `is_empty` es verdadero, invoca asíncronamente al servicio de Google Home Scripting para notificar el evento `food_level_critical`.

**Payload de Ejemplo:**
```json
{
  "distance": 150
}
```

**Respuesta Exitosa:**
```json
{
  "status": "success",
  "received": 150
}
```

### 2. Consulta de Estado (`GET /status`)

Este endpoint es consumido por clientes frontend (Dashboards, Apps Móviles) para visualizar el estado actual de los sensores.

*   **Propósito**: Proveer una vista procesada y lista para UI del estado del sensor.
*   **Lógica**:
    1.  Consulta el último registro en `sensor_telemetry` para el sensor principal.
    2.  Retorna un objeto JSON con indicadores de alerta, nivel actual y colores sugeridos para la interfaz.

**Respuesta de Ejemplo:**
```json
{
  "alert": false,
  "current_level": "150 cm",
  "last_sync": "2023-10-27T10:00:00.000Z",
  "ui_color": "GREEN"
}
```

---

## Modelo de Datos y Configuración

El servicio utiliza un modelo flexible basado en documentos en MongoDB.

### Colección: `services`
Almacena la configuración operativa de cada servicio/sensor. Esto permite cambiar el comportamiento del sistema en tiempo de ejecución.

**Ejemplo de Documento (`food_sensor`):**
```json
{
  "name": "food_sensor",
  "settings": {
    "ALERT_DISTANCE": 170
  }
}
```

### Colección: `sensor_telemetry`
Almacena el estado actual de los sensores. Actúa como el "Single Point of Truth".

**Ejemplo de Documento:**
```json
{
  "sensorId": "main_food",
  "distance_cm": 150,
  "is_empty": false,
  "timestamp": "2023-10-27T10:00:00.000Z"
}
```

---

## Despliegue y Gestión

### Scripts Principales

*   **`npm run dev`**: Inicia el entorno de desarrollo local con SST.
*   **`npm run db:seed`**: Ejecuta scripts de migración para inicializar configuraciones por defecto en la base de datos (ej. crear el servicio `food_sensor`).
*   **`npm run list:api:functions`**: Lista los endpoints desplegados y sus funciones Lambda asociadas.
*   **`npm run update:service:url`**: Actualiza los parámetros SSM de AWS con la URL del servicio desplegado, facilitando el descubrimiento de servicios.

### Configuración de Entorno

El proyecto requiere un archivo `.env` (o `.env.dev`/`.env.prod`) con las siguientes variables clave:

*   `MONGO_URI`: Cadena de conexión a MongoDB.
*   `AMAZON_SERVICE_SQS_DB_REQUESTS_QUEUE`: Cola SQS para peticiones a la base de datos.
*   `AMAZON_SERVICE_SQS_HS_REQUESTS_QUEUE`: Cola SQS propia del servicio Home Server.
*   `GOOGLE_HOME_SCRIPT_ENDPOINT`: Endpoint para disparar eventos en Google Home Scripting.
*   `GOOGLE_HOME_SCRIPT_KEY`: Clave de autenticación para Google Home Scripting.
