'use server';

import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';
import { prisma } from '@/lib/db/db.service';

const emptySchema = z.object({});
const nameSchema = z.object({ name: z.string().trim().min(1).max(255) });
const idSchema = z.object({ id: z.number().int().positive() });
const updateSchema = idSchema.extend({ name: z.string().trim().min(1).max(255) });

export const getTests = async () =>
  handleServerAction(
    emptySchema,
    async () => {
      return prisma.test.findMany();
    },
    {},
    { entityName: 'Test', actionType: 'list' }
  );

export const createTest = async (name: string) =>
  handleServerAction(
    nameSchema,
    async (data) => {
      return prisma.test.create({
        data: { name: data.name },
      });
    },
    { name },
    { entityName: 'Test', actionType: 'create' }
  );

export const getTestById = async (id: number) =>
  handleServerAction(
    idSchema,
    async (data) => {
      return prisma.test.findUnique({
        where: { id: data.id },
      });
    },
    { id },
    { entityName: 'Test', actionType: 'get' }
  );

export const updateTest = async (id: number, name: string) =>
  handleServerAction(
    updateSchema,
    async (data) => {
      return prisma.test.update({
        where: { id: data.id },
        data: { name: data.name },
      });
    },
    { id, name },
    { entityName: 'Test', actionType: 'update' }
  );

export const deleteTest = async (id: number) =>
  handleServerAction(
    idSchema,
    async (data) => {
      return prisma.test.delete({
        where: { id: data.id },
      });
    },
    { id },
    { entityName: 'Test', actionType: 'delete' }
  );

export const healthCheck = async () =>
  handleServerAction(
    emptySchema,
    async () => {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    },
    {},
    { entityName: 'Test', actionType: 'get' }
  );
