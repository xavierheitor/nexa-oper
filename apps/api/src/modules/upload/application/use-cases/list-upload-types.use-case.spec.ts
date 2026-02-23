import { ListUploadTypesUseCase } from './list-upload-types.use-case';

describe('ListUploadTypesUseCase', () => {
  it('returns registered types with metadata specs', () => {
    const registry = {
      listTypes: jest
        .fn()
        .mockReturnValue(['checklist-reprova', 'apr-evidence']),
      getMetadataSpec: jest
        .fn()
        .mockImplementation((type: string) =>
          type === 'checklist-reprova'
            ? { required: ['turnoId'], optional: ['checklistPerguntaId'] }
            : undefined,
        ),
    };

    const useCase = new ListUploadTypesUseCase(registry as never);
    const out = useCase.execute();

    expect(out.types).toEqual(['checklist-reprova', 'apr-evidence']);
    expect(out.metadataSpecs).toEqual({
      'checklist-reprova': {
        required: ['turnoId'],
        optional: ['checklistPerguntaId'],
      },
    });
  });
});
