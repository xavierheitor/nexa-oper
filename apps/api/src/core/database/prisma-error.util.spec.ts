import {
  isPrismaUniqueConstraintError,
} from './prisma-error.util';

describe('isPrismaUniqueConstraintError', () => {
  it('detects unique constraint by field hint', () => {
    expect(
      isPrismaUniqueConstraintError(
        {
          code: 'P2002',
          meta: { target: ['checklistRespostaId'] },
        },
        'checklistRespostaId',
      ),
    ).toBe(true);
  });

  it('returns false for other prisma errors', () => {
    expect(
      isPrismaUniqueConstraintError({ code: 'P2003' }, 'checklistRespostaId'),
    ).toBe(false);
  });
});
