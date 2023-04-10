import { z } from 'zod';

import { ValueObject } from '../index';

describe('ValueObject', () => {
  it('should be defined', () => {
    expect(ValueObject).toBeDefined();
  });

  it('should accept ValueObjects as Schema', async () => {
    class Street extends ValueObject('Street', z.string()) {}
    class StreetNumber extends ValueObject('StreetNumber', z.number()) {}
    const schema = z.object({ name: Street, age: StreetNumber.schema });
    class A extends ValueObject('A', schema) {}

    expect(() => new A({ name: 'John Doe', age: 22 })).not.toThrow();
    await expect(
      A.createAsync({ name: 'John Doe', age: 22 })
    ).resolves.not.toThrow();
  });

  it('should be immutable', () => {
    class Name extends ValueObject('Name', z.string()) {}
    const name = new Name('John Doe');
    expect(() =>
      Object.defineProperty(name, 'value', { value: 'Jane Doe' })
    ).toThrow('Cannot redefine property: value');

    class Address extends ValueObject(
      'Name',
      z.object({ street: z.string(), city: z.string() })
    ) {}
    const address = new Address({ street: 'Some Street', city: 'Some City' });
    expect(() =>
      Object.defineProperty(address.value, 'street', { value: 'Other Street' })
    ).toThrow('Cannot redefine property: street');
  });

  it('should evaluate instanceof correctly', () => {
    class Street extends ValueObject('Street', z.string()) {}
    class OtherStreet extends ValueObject('OtherStreet', z.string()) {}
    const street = new Street('Some Street');
    expect(street instanceof Street).toBe(true);
    expect(street instanceof OtherStreet).toBe(false);
  });

  it('should allow Array-type ValueObjects', () => {
    const schema = z.array(z.string());
    class ArrayType extends ValueObject('ArrayType', schema) {}
    const arrayType = new ArrayType(['John Doe', 'Jane Doe']);
    const arrayType2 = new ArrayType(arrayType);
    expect(arrayType.value).toEqual(['John Doe', 'Jane Doe']);
    expect(arrayType2.value).toEqual(['John Doe', 'Jane Doe']);
  });

  it('should allow Object-type ValueObjects', () => {
    const schema = z.object({ city: z.string(), street: z.string() });
    class ObjectType extends ValueObject('ObjectType', schema) {}
    const objectType = new ObjectType({
      city: 'Some City',
      street: 'Some Street',
    });
    const objectType2 = new ObjectType(objectType);
    expect(objectType.value).toEqual({
      city: 'Some City',
      street: 'Some Street',
    });
    expect(objectType2.value).toEqual({
      city: 'Some City',
      street: 'Some Street',
    });
  });

  it('should support nested ValueObjects', () => {
    const stringSchema = z.string();
    class StringO extends ValueObject('StringO', stringSchema) {}
    const arraySchema = z.array(stringSchema);
    class NestedArr extends ValueObject('Nested', arraySchema) {}
    const objSchema = z.object({ city: z.string(), street: z.string() });
    class NestedObj extends ValueObject('Nested', objSchema) {}
    const string = new StringO('Some String');

    const nested = new NestedArr([string, 'Other String']);
    const nested2 = new NestedArr(['Other String']);
    const nestedObj = new NestedObj({ city: string, street: 'Some Street' });
    expect(nested.value).toEqual(['Some String', 'Other String']);
    expect(nested2.value).toEqual(['Other String']);
    expect(nestedObj.value).toEqual({
      city: 'Some String',
      street: 'Some Street',
    });
  });

  it('should be equal to other ValueObject with same value', () => {
    class Name extends ValueObject('Name', z.string()) {}
    const name1 = new Name('John Doe');
    const name2 = new Name('John Doe');
    expect(name1 === name2).toBe(true);
    expect(name1.equals(name2)).toBe(true);

    class ArrayType extends ValueObject('ArrayType', z.array(z.string())) {}
    const arr = ['John Doe', 'Jane Doe'];
    const arrayType1 = new ArrayType(arr);
    const arrayType2 = new ArrayType(arr);
    expect(arrayType1 === arrayType2).toBe(true);
    expect(arrayType1.equals(arrayType2)).toBe(true);
    expect(arrayType1.equals(arr)).toBe(true);

    class ObjectType extends ValueObject(
      'ObjectType',
      z.object({ city: z.string(), street: z.string() })
    ) {}
    const obj = {
      city: 'Some City',
      street: 'Some Street',
    };
    const objectType1 = new ObjectType(obj);
    const objectType2 = new ObjectType(objectType1);
    expect(objectType1 === objectType2).toBe(true);
    expect(objectType1.equals(objectType2)).toBe(true);
    expect(objectType1.equals(obj)).toBe(true);
  });

  it('should handle async ZodTypes', async () => {
    class AsyncRefine extends ValueObject(
      'AsyncRefine',
      z.string().refine(async () => false)
    ) {}
    class AsyncTransform extends ValueObject(
      'AsyncTransform',
      z.string().transform(async () => '')
    ) {}

    await expect(async () => {
      new AsyncTransform('John Doe');
      await new Promise((res) => setTimeout(res, 10));
    }).rejects.toThrow(
      'Asynchronous transform encountered during synchronous parse operation. Use AsyncTransform.createAsync() instead of new AsyncTransform()'
    );
    await expect(async () => {
      new AsyncRefine('John Doe');
      await new Promise((res) => setTimeout(res, 10));
    }).rejects.toThrow(
      'Async refinement encountered during synchronous parse operation. Use AsyncRefine.createAsync() instead of new AsyncRefine()'
    );
    await expect(AsyncTransform.createAsync('John Doe')).resolves.not.toThrow();
    await expect(AsyncRefine.createAsync('John Doe')).rejects.toThrow(
      'Invalid input'
    );
  });

  it('should implement toStirng() correctly', () => {
    class Name extends ValueObject('Name', z.string()) {}
    const name = new Name('John Doe');
    expect(name.toString()).toBe('John Doe');

    class Numeric extends ValueObject('Numeric', z.number()) {}
    const numeric = new Numeric(123);
    expect(numeric.toString()).toBe('123');

    class Arr extends ValueObject('Arr', z.array(z.number())) {}
    const arr = new Arr([1, 2, 3]);
    expect(arr.toString()).toBe('1,2,3');
  });

  it('should implement valueOf() correctly', () => {
    class Name extends ValueObject('Name', z.string()) {}
    const name = new Name('John Doe');
    expect(name.valueOf()).toBe('John Doe');

    class Numeric extends ValueObject('Numeric', z.number()) {}
    const numeric = new Numeric(123);
    expect(numeric.valueOf()).toBe(123);

    class Arr extends ValueObject('Arr', z.array(z.number())) {}
    const arr = new Arr([1, 2, 3]);
    expect(arr.valueOf()).toEqual([1, 2, 3]);
  });

  it('should implement toJSON() correctly', () => {
    class Name extends ValueObject('Name', z.string()) {}
    const name = new Name('John Doe');
    expect(name.toJSON()).toBe('John Doe');

    class Numeric extends ValueObject('Numeric', z.number()) {}
    const numeric = new Numeric(123);
    expect(numeric.toJSON()).toBe(123);

    class Arr extends ValueObject('Arr', z.array(z.number())) {}
    const arr = new Arr([1, 2, 3]);
    expect(arr.toJSON()).toEqual('[1,2,3]');

    class Obj extends ValueObject('Obj', z.object({ a: z.number() })) {}
    const obj = new Obj({ a: 1 });
    expect(obj.toJSON()).toEqual('{"a":1}');
  });
});
