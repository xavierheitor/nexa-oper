import {
  buildStoredUploadUrl,
  normalizeStoredUploadResult,
  resolveStoredUploadPath,
} from './upload-url';

describe('upload-url', () => {
  it('extracts the relative path from legacy absolute API upload URLs', () => {
    expect(
      resolveStoredUploadPath(
        'https://api.nexa.xsys.team/api/uploads/medidores/123/foto.jpg',
      ),
    ).toBe('medidores/123/foto.jpg');
  });

  it('extracts the relative path from public upload URLs', () => {
    expect(
      resolveStoredUploadPath(
        'https://api.nexa.xsys.team/uploads/medidores/123/foto.jpg',
      ),
    ).toBe('medidores/123/foto.jpg');
  });

  it('builds relative public URLs from stored paths', () => {
    expect(buildStoredUploadUrl('medidores/123/foto.jpg')).toBe(
      '/uploads/medidores/123/foto.jpg',
    );
  });

  it('normalizes stored upload results to relative public URLs', () => {
    expect(
      normalizeStoredUploadResult({
        path: 'medidores/123/foto.jpg',
        url: 'https://api.nexa.xsys.team/api/uploads/medidores/123/foto.jpg',
        size: 10,
        mimeType: 'image/jpeg',
        filename: 'foto.jpg',
      }),
    ).toEqual({
      path: 'medidores/123/foto.jpg',
      url: '/uploads/medidores/123/foto.jpg',
      size: 10,
      mimeType: 'image/jpeg',
      filename: 'foto.jpg',
    });
  });
});
