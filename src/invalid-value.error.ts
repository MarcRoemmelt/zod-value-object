export class InvalidValueError extends Error {
  constructor(error: Error) {
    super(error.message);
    Object.assign(this, error);
  }
}
