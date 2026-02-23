// src/lib/repositories/ICrudRepository.ts
export interface IBaseCrudRepository<T, F> {
  delete(id: string | number, userId: string): Promise<T>;
  findById(id: string | number): Promise<T | null>;
  list(params: F): Promise<{ items: T[]; total: number }>;
}

export interface ICrudRepository<T, F> extends IBaseCrudRepository<T, F> {
  create(data: unknown): Promise<T>;
  update(id: string | number, data: unknown): Promise<T>;
}
