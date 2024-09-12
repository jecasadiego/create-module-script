
# Module Generator Script

Este script genera automáticamente la estructura de un módulo siguiendo la arquitectura DDD (Domain-Driven Design). Está diseñado para trabajar con Sequelize en un entorno Node.js y soporta múltiples bases de datos. La estructura está basada en un proyecto que utiliza Express con Node.js y TypeScript.

## Requisitos

Antes de comenzar, asegúrate de tener lo siguiente:

- **Node.js** y **NPM** instalados.
- **Express** instalado en tu proyecto. Puedes instalarlo con el siguiente comando:

  ```bash
  npm install express
  ```

- **Sequelize** y los paquetes de dialecto de base de datos correspondientes instalados:

  ```bash
  npm install sequelize mysql2 sqlite3 mssql
  ```

## Configuración

1. **Instalar Dependencias**

   Antes de ejecutar el script, asegúrate de instalar todas las dependencias necesarias ejecutando:

   ```bash
   npm install
   ```

2. **Configurar Variables de Entorno**

   Crea un archivo `.env` en el directorio raíz de tu proyecto con la configuración adecuada según el tipo de base de datos que estés utilizando.

   - **MySQL**:
     ```plaintext
     DB_NAME=your_database_name
     DB_USER=your_username
     DB_PASSWORD=your_password
     DB_HOST=localhost
     DB_PORT=3306
     DB_DIALECT=mysql
     ```

   - **SQL Server**:
     ```plaintext
     DB_NAME=your_database_name
     DB_USER=your_username
     DB_PASSWORD=your_password
     DB_HOST=your_host
     DB_PORT=1433
     DB_DIALECT=mssql
     ```

   - **SQLite**:
     ```plaintext
     DB_DIALECT=sqlite
     DB_STORAGE=./database.sqlite  # Ruta al archivo SQLite
     ```

## Uso del Script

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

### Estructura de Carpetas

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

### Alias de Módulos

Para facilitar la importación de módulos en tu proyecto, puedes agregar los siguientes alias en tu `package.json`:

```json
"_moduleAliases": {
    "@app": "src",
    "@api": "src/api/v1"
}
```

Esto te permitirá usar rutas relativas más sencillas como:

```typescript
import { UserController } from '@api/user/infrastructure/controller/user.controller';
```

## Personalización

Puedes personalizar el script para adaptarlo a tu entorno, incluyendo:

- Cambiar la configuración de la base de datos.
- Modificar las plantillas de código para cumplir con las convenciones de tu equipo.

## Licencia

Este proyecto está bajo la Licencia MIT. Siéntete libre de utilizarlo y modificarlo según tus necesidades.

---

Desarrollado por Juan Esteban Casadiego Benavides.
