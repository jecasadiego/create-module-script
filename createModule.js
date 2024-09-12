#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');


const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: process.env.DB_DIALECT || 'mssql',
  storage: process.env.DB_STORAGE || undefined,
  port: process.env.DB_PORT || 1433,
  logging: false 
});


const createDirectory = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const createFile = (filePath, content = '') => {
  fs.writeFileSync(filePath, content);
};

const moduleName = process.argv[2];
const tableName = process.argv[3];

if (!moduleName || !tableName) {
  console.error('Please provide a module name and a table name');
  process.exit(1);
}

const getColumnsFromTable = async (tableName) => {
  const [results] = await sequelize.query(`
    SELECT COLUMN_NAME as name, DATA_TYPE as type, IS_NULLABLE as isNullable, COLUMN_DEFAULT as dflt_value
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = '${tableName}'
  `);
  return results;
};

const mapDataTypeToSequelize = (type) => {
  if (type.includes('int')) return 'DataTypes.INTEGER';
  if (type.includes('varchar') || type.includes('text')) return 'DataTypes.STRING';
  if (type.includes('datetime') || type.includes('date') || type.includes('time')) return 'DataTypes.DATE';
  if (type.includes('bit')) return 'DataTypes.BOOLEAN';
  if (type.includes('float') || type.includes('double') || type.includes('real')) return 'DataTypes.FLOAT';
  if (type.includes('decimal') || type.includes('numeric')) return 'DataTypes.DECIMAL';
  return 'DataTypes.STRING';
};


const mapDataTypeToCustomType = (type) => {
  if (type.includes('int')) return 'number';
  if (type.includes('varchar') || type.includes('text') || type.includes('datetime') || type.includes('date') || type.includes('time')) return 'TNullableString';
  if (type.includes('bit')) return 'TNullableBoolean';
  return 'TNullableString';
};

const generateEntityAndModel = async () => {
  const columns = await getColumnsFromTable(tableName);

  let entityContent = `import { TNullableBoolean, TNullableString } from "@app/utils/constants/types";\n\n`;
  entityContent += `export class ${capitalize(moduleName)} {\n`;
  entityContent += `  constructor(\n`;
  columns.forEach(column => {
    entityContent += `    public ${column.name}: ${mapDataTypeToCustomType(column.type)},\n`;
  });
  entityContent += `  ) {}\n`;
  entityContent += `}\n`;

  let modelContent = `
import { Model, DataTypes } from 'sequelize';
import { getDbInstance } from '@app/app/database';
import { TNullableBoolean, TNullableString } from "@app/utils/constants/types";

const sequelizeInstance = getDbInstance();

export class ${capitalize(moduleName)}Model extends Model {\n`;
  columns.forEach(column => {
    modelContent += `  declare ${column.name}: ${mapDataTypeToCustomType(column.type)};\n`;
  });
  modelContent += `}

${capitalize(moduleName)}Model.init(
  {
    ${columns.map((col, index) => `${col.name}: {
      type: ${mapDataTypeToSequelize(col.type)},
      allowNull: ${col.isNullable === 'YES'},
      ${index === 0 ? 'primaryKey: true,' : ''} // Asigna primaryKey si es la primera columna
      ${col.dflt_value !== null ? `defaultValue: ${col.dflt_value},` : ''}
    }`).join(',\n    ')}    
  },
  {
    sequelize: sequelizeInstance,
    tableName: '${tableName}',
    schema: 'dbo',
    timestamps: false,
  }
);
`;

  createFile(path.join(baseDir, 'domain', `${moduleName}.entity.ts`), entityContent);
  createFile(path.join(baseDir, 'infrastructure', 'model', `${moduleName}.model.ts`), modelContent);

  console.log('Entidad y modelo generados con éxito.');
};

const baseDir = path.join(process.cwd(), 'src', 'api', 'v1', moduleName);



createDirectory(baseDir);
createDirectory(path.join(baseDir, 'application'));
createDirectory(path.join(baseDir, 'domain'));
createDirectory(path.join(baseDir, 'infrastructure'));
createDirectory(path.join(baseDir, 'infrastructure', 'repository'));
createDirectory(path.join(baseDir, 'infrastructure', 'controller'));
createDirectory(path.join(baseDir, 'infrastructure', 'model'));
createDirectory(path.join(baseDir, 'infrastructure', 'services'));
createDirectory(path.join(baseDir, 'infrastructure', 'routes'));

generateEntityAndModel().then(() => {
  const useCaseContent = `
import { I${capitalize(moduleName)}Repository } from '@api/${moduleName}/domain/${moduleName}.repository';
import { ${capitalize(moduleName)} } from '@api/${moduleName}/domain/${moduleName}.entity';

export class ${capitalize(moduleName)}UseCase {
    constructor(private readonly ${moduleName}Repository: I${capitalize(moduleName)}Repository) { }

    async list${capitalize(moduleName)}s(): Promise<${capitalize(moduleName)}[]> {
        return await this.${moduleName}Repository.findAll();
    }

    async get${capitalize(moduleName)}ById(id: number): Promise<${capitalize(moduleName)} | null> {
        return await this.${moduleName}Repository.findById(id);
    }

    async create${capitalize(moduleName)}(${moduleName}Data: Partial<${capitalize(moduleName)}>): Promise<${capitalize(moduleName)}> {
        return await this.${moduleName}Repository.create(${moduleName}Data);
    }

    public async update${capitalize(moduleName)}(id: number, ${moduleName}Data: Partial<${capitalize(moduleName)}>): Promise<${capitalize(moduleName)} | null> {
        return await this.${moduleName}Repository.update(id, ${moduleName}Data);
    }

    async delete${capitalize(moduleName)}(id: number): Promise<void> {
        return await this.${moduleName}Repository.delete(id);
    }
}
`;

  const domainRepositoryContent = `
import { ${capitalize(moduleName)} } from './${moduleName}.entity';

export interface I${capitalize(moduleName)}Repository {
  create(${moduleName}Data: Partial<${capitalize(moduleName)}>): Promise<${capitalize(moduleName)}>;
  findAll(): Promise<${capitalize(moduleName)}[]>;
  findById(id: number): Promise<${capitalize(moduleName)} | null>;
  update(id: number, ${moduleName}Data: Partial<${capitalize(moduleName)}>): Promise<${capitalize(moduleName)} | null>;
  delete(id: number): Promise<void>;
}
`;

  const infrastructureRepositoryContent = `
import { I${capitalize(moduleName)}Repository } from '@api/${moduleName}/domain/${moduleName}.repository';
import { ${capitalize(moduleName)}Model } from '@api/${moduleName}/infrastructure/model/${moduleName}.model';

export class ${capitalize(moduleName)}Repository implements I${capitalize(moduleName)}Repository {
    async findAll(): Promise<${capitalize(moduleName)}Model[]> {
        return await ${capitalize(moduleName)}Model.findAll();
    }

    async findById(id: number): Promise<${capitalize(moduleName)}Model | null> {
        return await ${capitalize(moduleName)}Model.findByPk(id);
    }

    async create(${moduleName}Data: Partial<${capitalize(moduleName)}Model>): Promise<${capitalize(moduleName)}Model> {
        return await ${capitalize(moduleName)}Model.create(${moduleName}Data);
    }

    async update(id: number, ${moduleName}Data: Partial<${capitalize(moduleName)}Model>): Promise<${capitalize(moduleName)}Model> {
        const entity = await ${capitalize(moduleName)}Model.findByPk(id);
        if (!entity) throw new Error('${capitalize(moduleName)} not found');
        return await entity.update(${moduleName}Data);
    }

    async delete(id: number): Promise<void> {
        const entity = await ${capitalize(moduleName)}Model.findByPk(id);
        if (!entity) throw new Error('${capitalize(moduleName)} not found');
        await entity.update({ is_deleted: true });
    }
}
`;

  const controllerContent = `
import { Request, Response } from 'express';
import { ${capitalize(moduleName)}UseCase } from '@api/${moduleName}/application/${moduleName}.usecase';
import { codeHTTPStatus, ErrorMessage, success, warning } from '@app/utils/constants/http.responses';

export class ${capitalize(moduleName)}Controller {
    constructor(private ${moduleName}UseCase: ${capitalize(moduleName)}UseCase) {}

    public list${capitalize(moduleName)}s = async ({ method }: Request, res: Response) => {
        try {
            const entities = await this.${moduleName}UseCase.list${capitalize(moduleName)}s();
            return success(res, method, codeHTTPStatus.OK, entities, true);
        } catch (error: unknown) {
            const errorAsError = error as Error;
            return warning(res, ErrorMessage.GET_DATA_ERROR, codeHTTPStatus.INTERNAL_SERVER_ERROR, errorAsError.message);
        }
    };

    public get${capitalize(moduleName)}ById = async ({ params: { id }, method }: Request, res: Response) => {
        try {
            const entity = await this.${moduleName}UseCase.get${capitalize(moduleName)}ById(+id);
            if (!entity) {
                return warning(res, ErrorMessage.NOT_FOUND_ERROR, codeHTTPStatus.NOT_FOUND, "${capitalize(moduleName)} not found");
            }
            return success(res, method, codeHTTPStatus.OK, entity, true);
        } catch (error: unknown) {
            const errorAsError = error as Error;
            return warning(res, ErrorMessage.GET_DATA_ERROR, codeHTTPStatus.INTERNAL_SERVER_ERROR, errorAsError.message);
        }
    };

    public create${capitalize(moduleName)} = async ({ body, method }: Request, res: Response) => {
        try {
            const newEntity = await this.${moduleName}UseCase.create${capitalize(moduleName)}(body);
            return success(res, method, codeHTTPStatus.CREATED, newEntity, true);
        } catch (error: unknown) {
            const errorAsError = error as Error;
            return warning(res, ErrorMessage.CREATE_DATA_ERROR, codeHTTPStatus.INTERNAL_SERVER_ERROR, errorAsError.message);
        }
    };

    public update${capitalize(moduleName)} = async ({ params: { id }, body, method }: Request, res: Response) => {
        try {
            const updatedEntity = await this.${moduleName}UseCase.update${capitalize(moduleName)}(+id, body);
            return success(res, method, codeHTTPStatus.OK, updatedEntity, true);
        } catch (error: unknown) {
            const errorAsError = error as Error;
            return warning(res, ErrorMessage.UPDATE_DATA_ERROR, codeHTTPStatus.INTERNAL_SERVER_ERROR, errorAsError.message);
        }
    };

    public delete${capitalize(moduleName)} = async ({ params: { id }, method }: Request, res: Response) => {
        try {
            await this.${moduleName}UseCase.delete${capitalize(moduleName)}(+id);
            return success(res, method, codeHTTPStatus.NO_CONTENT, [], true);
        } catch (error: unknown) {
            const errorAsError = error as Error;
            return warning(res, ErrorMessage.DELETE_DATA_ERROR, codeHTTPStatus.INTERNAL_SERVER_ERROR, errorAsError.message);
        }
    };
}
`;

  const servicesContent = `
import { ${capitalize(moduleName)}Controller } from "@api/${moduleName}/infrastructure/controller/${moduleName}.controller";
import { ${capitalize(moduleName)}UseCase } from "@api/${moduleName}/application/${moduleName}.usecase";
import { ${capitalize(moduleName)}Repository } from "@api/${moduleName}/infrastructure/repository/${moduleName}.repository";

export const ${moduleName}Repository = new ${capitalize(moduleName)}Repository();

export const ${moduleName}UseCase = new ${capitalize(moduleName)}UseCase(${moduleName}Repository);

export const ${moduleName}Controller = new ${capitalize(moduleName)}Controller(${moduleName}UseCase);
`;

  const routesContent = `
import { Router } from "express";
import { ${moduleName}Controller } from "@api/${moduleName}/infrastructure/services/${moduleName}.services";
import { asyncMiddleware } from "@app/utils/middleware/middleware";

export const routes${capitalize(moduleName)} = Router();

routes${capitalize(moduleName)}.get("/", asyncMiddleware(${moduleName}Controller.list${capitalize(moduleName)}s));
routes${capitalize(moduleName)}.get("/:id", asyncMiddleware(${moduleName}Controller.get${capitalize(moduleName)}ById));
routes${capitalize(moduleName)}.post("/create", asyncMiddleware(${moduleName}Controller.create${capitalize(moduleName)}));
routes${capitalize(moduleName)}.put("/update/:id", asyncMiddleware(${moduleName}Controller.update${capitalize(moduleName)}));
routes${capitalize(moduleName)}.delete("/delete/:id", asyncMiddleware(${moduleName}Controller.delete${capitalize(moduleName)}));
`;

  // Crear los archivos restantes en las carpetas correspondientes
  createFile(path.join(baseDir, 'application', `${moduleName}.usecase.ts`), useCaseContent);
  createFile(path.join(baseDir, 'domain', `${moduleName}.repository.ts`), domainRepositoryContent);
  createFile(path.join(baseDir, 'infrastructure', 'repository', `${moduleName}.repository.ts`), infrastructureRepositoryContent);
  createFile(path.join(baseDir, 'infrastructure', 'controller', `${moduleName}.controller.ts`), controllerContent);
  createFile(path.join(baseDir, 'infrastructure', 'services', `${moduleName}.services.ts`), servicesContent);
  createFile(path.join(baseDir, 'infrastructure', 'routes', `${moduleName}.routes.ts`), routesContent);

  console.log('Module created successfully!');
});

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
