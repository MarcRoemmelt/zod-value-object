# value-object-ts

Fully typed value objects for TypeScript build on top of [zod](https://github.com/colinhacks/zod)

# Motivation

This library provides a small utility class that guarantees three things:

1. ValueObjects are immutable
2. ValueObjects are typesafe
3. ValueObjects are equal if their values are equal

# Installation

```typescript
  npm install value-object-ts     # npm
  yarn add alue-object-ts         # yarn
  pnpm add alue-object-ts         # pnpm
```

# Usage

```typescript
import { ValueObject } from 'value-object-ts';

/* Primitives */
const schema = z.string().email();
class Email extends ValueObject('Email', schema) {}
const email = new Email('some@email.com');
console.log(email.value); // => "some@email.com"

/* Other Types */
const schema = z.object({ email: z.string() });
const schema = z.object({ email: Email }); // => Can use ValueObjects as schema
class Obj extends ValueObject('Obj', schema) {}
const obj = new Obj({ email: 'some@email.com' });
const obj = new Obj({ email: email }); // => Can use ValueObjects as input
```

# Immutability

```typescript
const schema = z.string().email();
class Email extends ValueObject('Email', schema) {}
const email = new Email('some@email.com');

email.value = 'other@email.com'; // => throws Error, same on nested properties
```

# Typesafety

```typescript
const schema = z.string().email();
class Email extends ValueObject('Email', schema) {}
const email = new Email('some@email.com');

/* Wrong input */
const email = new Email(22); // => throws InvalidInputError

/* Use as parameter type */
const useEmail = (email: Email) => {
  //
};
useEmail(email); // => works
useEmail('someEmail'); // => throws TypeScript error
class OtherString extends ValueObject('OtherString', schema) {}
const otherString = new OtherString('some@email.com');
useEmail(otherString); // => also throws TypeScript error
```

# Equality

```typescript
const schema = z.string().email();
class Email extends ValueObject('Email', schema) {}
const email = new Email('some@email.com');
const sameEmail = new Email('some@email.com');
const otherEmail = new Email('other@email.com');

console.log(email === sameEmail); // => true
console.log(email.equals(sameEmail)); // => true

console.log(email === otherEmail); // => false
console.log(email.equals(otherEmail)); // => false
```
