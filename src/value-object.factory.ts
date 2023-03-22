import { ZodBranded, ZodTypeAny } from 'zod';

import { typeUtil, util } from './helpers/util';
import { InvalidValueError } from './invalid-value.error';
import { ValueObjectCtor } from './value-object.constructor';

const createBaseClass = <
  Type extends string,
  Schema extends ZodBranded<any, any>
>(
  brandedSchema: Schema,
  type: Type
) => {
  class ValueObject extends ValueObjectCtor<Type, typeof brandedSchema> {
    static schema: typeof brandedSchema;
    static type: typeof type;

    static async createAsync(value: typeUtil.Input<typeof brandedSchema>) {
      const unwrapped = ValueObjectCtor.toPlainValue(value);
      await ValueObject.prototype.schema.parseAsync(unwrapped);
      return util.flyweight.run(ValueObject, type, unwrapped);
    }
  }
  util.defineImmutable(ValueObject, 'schema', brandedSchema, true);
  util.defineImmutable(ValueObject, 'type', type, true);
  util.defineImmutable(ValueObject.prototype, 'schema', brandedSchema, true);
  util.defineImmutable(ValueObject.prototype, 'type', type);
  return ValueObject;
};
type BaseClass = ReturnType<typeof createBaseClass>;

const createExtendableClass = <B extends BaseClass>(
  BaseClass: B,
  brandedSchema: ZodBranded<any, any>
) => {
  class ExtendableClass {
    static schema: typeof BaseClass.schema;

    static async createAsync(value: typeUtil.Input<typeof brandedSchema>) {
      return BaseClass.createAsync(value);
    }

    constructor(value: typeUtil.Input<typeof brandedSchema>) {
      const unwrapped = ValueObjectCtor.toPlainValue(value);
      const instance = util.flyweight.run(BaseClass, BaseClass.type, unwrapped);
      validateSync(instance, unwrapped, this.constructor.name);
      copyPrototypeTo(
        this.constructor.prototype,
        instance.constructor.prototype
      );
      return instance;
    }
  }
  util.defineImmutable(ExtendableClass, 'schema', BaseClass.schema, true);
  return ExtendableClass;
};

export function ValueObject<Type extends string, TSchema extends ZodTypeAny>(
  type: typeUtil.Literal<Type>,
  schema: TSchema
) {
  const brandedSchema = util.brandSchema(schema, type);
  const BaseClass = createBaseClass(brandedSchema, type);
  const ExtendableClass = createExtendableClass(BaseClass, brandedSchema);
  type T = typeof BaseClass & typeof brandedSchema;

  return new Proxy<T>(ExtendableClass as T, {
    get: (target, prop) => {
      if (!(prop in target) && prop in brandedSchema) {
        // @ts-expect-error ts(2339)
        return brandedSchema[prop];
      }
      // @ts-expect-error ts(2339)
      return target[prop];
    },
  });
}

const validateSync = (
  instance: InstanceType<BaseClass>,
  value: any,
  name: string
) => {
  try {
    instance['validate'](value);
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('Async refinement encountered') ||
        error.message.includes('Asynchronous transform encountered'))
    ) {
      error.message = error.message.replace(
        'Use .parseAsync instead.',
        `Use ${name}.createAsync() instead of new ${name}()`
      );
    }
    throw new InvalidValueError(error as Error);
  }
};

const copyPrototypeTo = (prototype1: object, prototype2: object) => {
  const names = Object.getOwnPropertyNames(prototype1);
  for (const prop of names) {
    if (prop in prototype2) continue;
    const desc = Object.getOwnPropertyDescriptor(prototype1, prop);
    desc && Object.defineProperty(prototype2, prop, desc);
  }
};
