export class RetryableActionException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RetryableActionException';
  }
}

export class NonRetryableActionException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NonRetryableActionException';
  }
}
