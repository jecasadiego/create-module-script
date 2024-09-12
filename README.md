
# Module Generator Script

Este script genera automáticamente la estructura de un módulo siguiendo la arquitectura DDD (Domain-Driven Design). Está diseñado para trabajar con Sequelize en un entorno Node.js y soporta múltiples bases de datos, siendo personalizable para adaptarse a diferentes configuraciones.

## Configuración

Antes de ejecutar el script, debes configurar los detalles de tu base de datos en el archivo:

```javascript
const sequelize = new Sequelize('DATABASE_NAME', 'USERNAME', 'PASSWORD', {
  host: 'HOST_URL',
  dialect: 'mssql',  // Puedes cambiar a 'mysql', 'postgres', etc., según la base de datos que estés utilizando
  port: 1433         // Cambia el puerto según tu configuración
});
```

## Uso

### Requisitos

- Node.js y NPM instalados.
- Una base de datos configurada y accesible.
- Acceso al esquema de la base de datos para poder extraer las columnas de las tablas.

### Ejecución

Para ejecutar el script, abre una terminal en el directorio donde se encuentra el script y utiliza el siguiente comando:

```bash
node generateModule.js [NombreDelModulo] [NombreDeLaTabla]
```

Ejemplo:

```bash
node generateModule.js User users
```

Este comando generará la estructura del módulo `User` basado en la tabla `users` de tu base de datos.

### Archivos Generados

El script generará la siguiente estructura de carpetas y archivos dentro de `src/api/v1/[NombreDelModulo]`:

- **domain/**
  - `[NombreDelModulo].entity.ts`: La entidad que representa el módulo.
  - `[NombreDelModulo].repository.ts`: La interfaz del repositorio del módulo.

- **infrastructure/**
  - **model/**
    - `[NombreDelModulo].model.ts`: El modelo Sequelize del módulo.
  - **repository/**
    - `[NombreDelModulo].repository.ts`: Implementación del repositorio del módulo.
  - **controller/**
    - `[NombreDelModulo].controller.ts`: Controlador del módulo.
  - **services/**
    - `[NombreDelModulo].services.ts`: Servicios del módulo.
  - **routes/**
    - `[NombreDelModulo].routes.ts`: Rutas del módulo.

- **application/**
  - `[NombreDelModulo].usecase.ts`: Casos de uso del módulo.

### Personalización

Puedes personalizar el script para adaptarlo a tu entorno, incluyendo:

- Cambiar la configuración de la base de datos.
- Modificar las plantillas de código para cumplir con las convenciones de tu equipo.

### Licencia

Este proyecto está bajo la Licencia MIT. Siéntete libre de utilizarlo y modificarlo según tus necesidades.

---

Desarrollado por Juan Esteban Casadiego Benavides.
