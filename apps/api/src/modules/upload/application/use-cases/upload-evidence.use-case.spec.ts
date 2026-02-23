import { UploadEvidenceUseCase } from './upload-evidence.use-case';

describe('UploadEvidenceUseCase', () => {
  it('delegates upload to processor port', async () => {
    const processor = {
      upload: jest.fn().mockResolvedValue({
        path: 'checklists/1/reprovas/foto.jpg',
        size: 100,
        url: '/uploads/checklists/1/reprovas/foto.jpg',
        mimeType: 'image/jpeg',
      }),
    };

    const useCase = new UploadEvidenceUseCase(processor as never);

    const result = await useCase.execute(
      {
        buffer: Buffer.from('abc'),
        mimetype: 'image/jpeg',
        size: 100,
        originalname: 'foto.jpg',
      },
      {
        type: 'checklist-reprova',
        entityId: '1',
      },
    );

    expect(processor.upload).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      path: 'checklists/1/reprovas/foto.jpg',
      size: 100,
    });
  });
});
