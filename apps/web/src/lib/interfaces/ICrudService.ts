// src/lib/services/ICrudService.ts
export interface ICrudService<TCreate, TUpdate, TFilter, T> {
  create(data: TCreate, userId: string): Promise<T>;
  update(data: TUpdate, userId: string): Promise<T>;
  delete(id: number | string, userId: string): Promise<T>;
  getById(id: number | string): Promise<T | null>;
  list(
    params: TFilter
  ): Promise<{ data: T[]; total: number; totalPages: number }>;
}
