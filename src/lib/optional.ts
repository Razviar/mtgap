export class Optional<T> {
  private readonly value?: T;

  constructor(value?: T) {
    this.value = value;
  }

  public isEmpty(): boolean {
    return this.value === undefined;
  }

  public nonEmpty(): boolean {
    return this.value !== undefined;
  }

  public getOrElse(defaultValue: T): T {
    return this.value || defaultValue;
  }

  public map<U>(mapper: (value: T) => U): Optional<U> {
    return new Optional(this.value ? mapper(this.value) : undefined);
  }

  public flatMap<U>(mapper: (value: T) => Optional<U>): Optional<U> {
    return this.value ? mapper(this.value) : new Optional();
  }
}

export function Some<T>(value: T): Optional<T> {
  return new Optional(value);
}

export function None<T>(): Optional<T> {
  return new Optional();
}

export class OptionalMap<K, V> extends Map<K, V> {
  public getOpt(key: K): Optional<V> {
    return new Optional(this.get(key));
  }
}
