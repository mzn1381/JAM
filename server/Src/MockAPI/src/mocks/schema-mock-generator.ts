import { fakerFA as faker } from '@faker-js/faker';
import RandExp from 'randexp';
import type { SchemaObject } from '../types/openapi.js';

const tinyPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIW2P8z8DwHwAFgwJ/lF2rVwAAAABJRU5ErkJggg==';

export class SchemaMockGenerator {
  generate(schema?: SchemaObject): unknown {
    if (!schema) {
      return null;
    }

    return this.generateFromSchema(schema, 'root');
  }

  private generateFromSchema(schema: SchemaObject, key: string): unknown {
    if (Array.isArray(schema.oneOf) && schema.oneOf.length > 0) {
      const nonNullSchemas = schema.oneOf.filter((item): item is SchemaObject => item !== null && typeof item === 'object' && !this.isNullOnlySchema(item));
      const selected = (nonNullSchemas.length > 0 ? faker.helpers.arrayElement(nonNullSchemas) : schema.oneOf[0]) as SchemaObject;
      return this.generateFromSchema(selected, key);
    }

    if (Array.isArray(schema.anyOf) && schema.anyOf.length > 0) {
      const selected = faker.helpers.arrayElement(schema.anyOf.filter((item): item is SchemaObject => item !== null && typeof item === 'object'));
      return this.generateFromSchema(selected, key);
    }

    if (Array.isArray(schema.enum) && schema.enum.length > 0) {
      return faker.helpers.arrayElement(schema.enum);
    }

    const candidateTypes = this.extractTypes(schema);
    const type = this.pickType(candidateTypes, key);

    switch (type) {
      case 'object':
        return this.generateObject(schema);
      case 'array':
        return this.generateArray(schema, key);
      case 'string':
        return this.generateString(schema, key);
      case 'integer':
      case 'number':
        return this.generateNumber(schema, type, key);
      case 'boolean':
        return faker.datatype.boolean();
      case 'null':
        return null;
      default:
        if ('default' in schema) {
          return schema.default;
        }
        return null;
    }
  }

  private generateObject(schema: SchemaObject): Record<string, unknown> {
    const properties = (schema.properties ?? {}) as Record<string, SchemaObject>;
    const required = new Set(Array.isArray(schema.required) ? schema.required.map(String) : []);

    if (this.isStandardEnvelope(properties)) {
      return {
        data: this.generateFromSchema(properties.data, 'data'),
        success: true,
        code: 1,
        error: null,
        message: null,
      };
    }

    const result: Record<string, unknown> = {};

    for (const [key, propertySchema] of Object.entries(properties) as Array<[string, SchemaObject]>) {
      const shouldInclude = required.has(key) || faker.datatype.boolean({ probability: 0.88 });
      if (!shouldInclude) {
        continue;
      }

      result[key] = this.generateFromSchema(propertySchema, key);
    }

    return result;
  }

  private generateArray(schema: SchemaObject, key: string): unknown[] {
    const itemSchema = (schema.items ?? {}) as SchemaObject;
    const minItems = typeof schema.minItems === 'number' ? schema.minItems : 1;
    const maxItems = typeof schema.maxItems === 'number' ? schema.maxItems : Math.max(minItems, 3);
    const count = faker.number.int({ min: minItems, max: Math.min(maxItems, minItems + 2) });

    return Array.from({ length: count }, () => this.generateFromSchema(itemSchema, this.toSingular(key)));
  }

  private generateString(schema: SchemaObject, key: string): string | null {
    if (this.shouldReturnNull(schema)) {
      return null;
    }

    const normalizedKey = key.toLowerCase();
    const defaultValue = typeof schema.default === 'string' ? schema.default : undefined;
    const description = typeof schema.description === 'string' ? schema.description.toLowerCase() : '';

    if (normalizedKey.includes('imagebase64')) {
      return tinyPngBase64;
    }

    if (normalizedKey.includes('mobile') || defaultValue?.startsWith('09')) {
      return `09${faker.string.numeric(9)}`;
    }

    if (normalizedKey.includes('nationalcode') || description.includes('کد ملی')) {
      return faker.string.numeric(10);
    }

    if (normalizedKey.includes('birthdate') || normalizedKey === 'date' || description.includes('تاریخ')) {
      return `${faker.number.int({ min: 1350, max: 1405 })}/${faker.number.int({ min: 1, max: 12 })}/${faker.number.int({ min: 1, max: 28 })}`;
    }

    if (normalizedKey.includes('plate')) {
      return `${faker.string.numeric(2)}${faker.helpers.arrayElement(['الف', 'ب', 'ج', 'د', 'س'])}${faker.string.numeric(3)}${faker.string.numeric(2)}`;
    }

    if (normalizedKey.includes('iban')) {
      return `IR${faker.string.numeric(24)}`;
    }

    if (normalizedKey.includes('card')) {
      return faker.finance.creditCardNumber('################');
    }

    if (normalizedKey.includes('email')) {
      return faker.internet.email();
    }

    if (typeof schema.pattern === 'string') {
      try {
        return new RandExp(schema.pattern).gen();
      } catch {
        // Fall back to friendlier generated values below when regex synthesis is not feasible.
      }
    }

    if (defaultValue) {
      return this.randomizeDefaultString(defaultValue, normalizedKey);
    }

    if (description.includes('نام')) {
      return faker.person.firstName();
    }

    if (description.includes('آدرس')) {
      return faker.location.streetAddress();
    }

    if (description.includes('توضیح')) {
      return faker.lorem.sentence();
    }

    return faker.helpers.arrayElement([
      faker.lorem.word(),
      faker.lorem.words({ min: 1, max: 3 }),
      faker.string.alphanumeric(10),
    ]);
  }

  private generateNumber(schema: SchemaObject, type: 'integer' | 'number', key: string): number | string | null {
    if (this.shouldReturnNull(schema)) {
      return null;
    }

    const defaultValue = typeof schema.default === 'number' ? schema.default : undefined;
    const min = typeof schema.minimum === 'number' ? schema.minimum : this.getFriendlyMinimum(key);
    const max = typeof schema.maximum === 'number' ? schema.maximum : defaultValue !== undefined ? Math.max(defaultValue * 2, defaultValue + 100) : 1000000;
    const generatedNumber = defaultValue !== undefined
      ? this.randomizeAroundDefault(defaultValue)
      : faker.number.int({ min, max: Math.max(min + 1, Math.floor(max)) });

    const numericValue = type === 'integer' ? Math.round(generatedNumber) : Number(generatedNumber.toFixed(2));
    const allowsString = Array.isArray(schema.type) && schema.type.includes('string');

    return allowsString && faker.datatype.boolean({ probability: 0.05 }) ? String(numericValue) : numericValue;
  }

  private extractTypes(schema: SchemaObject): string[] {
    if (Array.isArray(schema.type)) {
      return schema.type.map(String);
    }

    if (typeof schema.type === 'string') {
      return [schema.type];
    }

    if (schema.properties) {
      return ['object'];
    }

    if (schema.items) {
      return ['array'];
    }

    return [];
  }

  private pickType(types: string[], key: string): string {
    const filtered = types.filter((candidate) => candidate !== 'null');
    if (filtered.length === 0) {
      return types[0] ?? (key ? 'string' : 'object');
    }

    return faker.helpers.arrayElement(filtered);
  }

  private shouldReturnNull(schema: SchemaObject): boolean {
    return Array.isArray(schema.type) && schema.type.includes('null') && faker.datatype.boolean({ probability: 0.12 });
  }

  private isNullOnlySchema(schema: SchemaObject): boolean {
    return schema.type === 'null' || (Array.isArray(schema.type) && schema.type.length === 1 && schema.type[0] === 'null');
  }

  private isStandardEnvelope(properties: Record<string, SchemaObject>): properties is Record<'data' | 'success' | 'code' | 'error' | 'message', SchemaObject> {
    return ['data', 'success', 'code', 'error', 'message'].every((key) => key in properties);
  }

  private getFriendlyMinimum(key: string): number {
    const normalizedKey = key.toLowerCase();

    if (normalizedKey === 'code') {
      return 1;
    }

    if (normalizedKey.includes('amount') || normalizedKey.includes('count') || normalizedKey.includes('total')) {
      return 1;
    }

    return 0;
  }

  private randomizeDefaultString(defaultValue: string, key: string): string {
    if (/^\d+$/.test(defaultValue)) {
      return faker.string.numeric(defaultValue.length);
    }

    if (/^[A-Z]{2}\d+$/.test(defaultValue)) {
      return `${defaultValue.slice(0, 2)}${faker.string.numeric(defaultValue.length - 2)}`;
    }

    if (/^[-_A-Za-z0-9]+$/.test(defaultValue)) {
      return `${defaultValue.slice(0, Math.min(defaultValue.length, 4))}${faker.string.alphanumeric(Math.max(2, Math.min(8, defaultValue.length)))}`;
    }

    if (key.includes('firstname')) {
      return faker.person.firstName();
    }

    if (key.includes('lastname')) {
      return faker.person.lastName();
    }

    return defaultValue;
  }

  private randomizeAroundDefault(defaultValue: number): number {
    const delta = Math.max(1, Math.round(Math.abs(defaultValue) * 0.35));
    return faker.number.int({ min: Math.max(0, defaultValue - delta), max: defaultValue + delta });
  }

  private toSingular(key: string): string {
    return key.endsWith('s') ? key.slice(0, -1) : key;
  }
}
