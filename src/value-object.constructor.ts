import { ZodBranded, ZodFirstPartySchemaTypes, ZodTypeAny } from 'zod';

import { typeUtil, util } from './helpers/util';
import { InvalidValueError } from './invalid-value.error';

export class ValueObjectCtor<
  Type extends string,
  TSchema extends ZodBranded<ZodTypeAny, string> = ZodBranded<
    ZodTypeAny,
    string
  >,
  T extends typeUtil.TPlain<TSchema> = typeUtil.TPlain<TSchema>,
  TInput extends typeUtil.Input<TSchema> = typeUtil.Input<TSchema>
> implements typeUtil.ValueObjectCtor<Type, TSchema, T, TInput>
{
  /* This field ensures we cannot use a different ValueObject with
   * the same shape instead. */
  // @ts-ignore ts(6133)
  public readonly type: Type;
  public readonly schema: TSchema;
  public readonly value: T;

  validate(value: T): T {
    try {
      return this.schema.parse(value);
    } catch (error) {
      throw new InvalidValueError(error as Error);
    }
  }

  toPlainValue(value: TInput = this.value): T {
    return ValueObjectCtor.toPlainValue<TSchema>(value);
  }

  equals(other: TInput): boolean {
    const Ctor = this.constructor as typeof ValueObjectCtor;
    return (
      util.flyweight.run(Ctor, this.type, Ctor.toPlainValue(other)) === this
    );
  }

  with(value: typeUtil.PartialValue<T>): this {
    const Ctor = this.constructor as typeUtil.Ctor<this>;
    if (util.isPrimitive(value))
      return util.flyweight.run(Ctor, this.type, value);

    if (typeof value === 'object' && value !== null) {
      const newValue = Object.assign({}, this.value, value);
      return util.flyweight.run(Ctor, this.type, newValue);
    }

    return util.flyweight.run(Ctor, this.type, value);
  }

  constructor(value: TInput) {
    util.defineImmutable(this, 'value', Object.freeze(value), true);
  }

  static toPlainValue<
    Schema extends ZodFirstPartySchemaTypes,
    T extends typeUtil.Input<Schema> = typeUtil.Input<Schema>
  >(value: T): typeUtil.TPlain<Schema> {
    if (isValueObject(value)) return value.toPlainValue();

    if (Array.isArray(value)) {
      return value.map((item: typeUtil.Input<any>) =>
        ValueObjectCtor.toPlainValue(item)
      ) as typeUtil.TPlain<Schema>;
    }
    if (typeof value === 'object' && value !== null) {
      return Object.entries(value).reduce(
        (acc, [key, value]) => ({
          ...acc,
          [key]: ValueObjectCtor.toPlainValue(value as typeUtil.Input<any>),
        }),
        {} as typeUtil.TPlain<Schema>
      );
    }
    return value as typeUtil.TPlain<Schema>;
  }

  static _disableFlyweight() {
    util.flyweight.run = util.flyweightDisabled;
  }
  static _enableFlyweight() {
    util.flyweight.run = util.flyweightEnabled;
  }
}

const isValueObject = (
  value: unknown
): value is typeUtil.ValueObjectCtor<string> => {
  return (
    value !== null &&
    typeof value === 'object' &&
    value instanceof ValueObjectCtor
  );
};
