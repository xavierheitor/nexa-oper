import { assertMobileAppVersionSupported } from './mobile-app-version-gate.service';

describe('MobileAppVersionGateService', () => {
  it('does not block when no minimum version is configured', () => {
    expect(() =>
      assertMobileAppVersionSupported({}, {
        action: 'login',
        versaoApp: undefined,
        plataformaApp: undefined,
      }),
    ).not.toThrow();
  });

  it('uses android as default platform when platform is omitted', () => {
    expect(() =>
      assertMobileAppVersionSupported(
        {
          MOBILE_MIN_VERSION_ANDROID_LOGIN: '1.8.0',
        },
        {
          action: 'login',
          versaoApp: '1.8.0',
        },
      ),
    ).not.toThrow();
  });

  it('blocks when app version is missing and gate is enabled', () => {
    expect(() =>
      assertMobileAppVersionSupported(
        {
          MOBILE_MIN_VERSION_ANDROID_LOGIN: '1.8.0',
        },
        {
          action: 'login',
        },
      ),
    ).toThrow('Versão do aplicativo é obrigatória para login');
  });

  it('blocks when version is below the minimum for the flow', () => {
    expect(() =>
      assertMobileAppVersionSupported(
        {
          MOBILE_MIN_VERSION_ANDROID_LOGIN: '1.8.0',
        },
        {
          action: 'login',
          versaoApp: '1.7.9',
          plataformaApp: 'android',
        },
      ),
    ).toThrow('Versão do aplicativo não suportada para login');
  });

  it('prefers the flow-specific minimum over the generic platform minimum', () => {
    expect(() =>
      assertMobileAppVersionSupported(
        {
          MOBILE_MIN_VERSION_ANDROID: '1.5.0',
          MOBILE_MIN_VERSION_ANDROID_OPEN_TURNO: '2.0.0',
        },
        {
          action: 'open-turno',
          versaoApp: '1.9.9',
          plataformaApp: 'android',
        },
      ),
    ).toThrow('Mínima exigida para android: 2.0.0');
  });

  it('supports ios-specific configuration', () => {
    expect(() =>
      assertMobileAppVersionSupported(
        {
          MOBILE_MIN_VERSION_IOS_LOGIN: '3.1.0',
        },
        {
          action: 'login',
          versaoApp: '3.1.0',
          plataformaApp: 'ios',
        },
      ),
    ).not.toThrow();
  });
});
