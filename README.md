# PSF Home Server Service

**Home Server** es un microservicio diseñado para centralizar la comunicación y gestión de dispositivos IoT en el hogar. Actúa como un puente seguro y eficiente entre los dispositivos físicos (como sensores ESP8266) y la infraestructura en la nube, permitiendo la ingesta de telemetría, la configuración dinámica de servicios y la consulta de estados en tiempo real.

## Visión y Propósito

El objetivo principal de este proyecto es crear un ecosistema de hogar inteligente robusto y escalable, donde la comunicación no dependa de implementaciones *hardcodeadas* en los dispositivos, sino que sea gestionada por una capa de servicio inteligente.

Este servicio no solo almacena datos, sino que **gestiona la verdad única** del estado del hogar, permitiendo que múltiples interfaces (dashboards, aplicaciones móviles) consuman información consistente y actualizada. Además, actúa como un **orquestador de automatización**, integrándose con plataformas como Google Home Scripting para reaccionar ante eventos críticos.

## Documentación Técnica

Para detalles técnicos específicos sobre la implementación, consulte la documentación en `core/docs`:

*   [Arquitectura Técnica](../db/core/docs/architecture.md)
*   [API Endpoints](../db/core/docs/api-endpoints.md)
*   [Modelo de Datos](../db/core/docs/data-model.md)
*   [Despliegue y Gestión](../db/core/docs/deployment.md)
