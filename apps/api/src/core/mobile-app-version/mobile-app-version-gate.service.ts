import { Injectable } from '@nestjs/common';
import { env } from '../config/env';
import { AppError } from '../errors/app-error';

export type MobilePlatform = 'android' | 'ios';
export type MobileGateAction = 'login' | 'open-turno';

export interface MobileAppVersionGateInput {
  action: MobileGateAction;
  versaoApp?: string | null;
  plataformaApp?: string | null;
}

export interface MobileAppVersionGateConfig {
  MOBILE_MIN_VERSION_ANDROID?: string;
  MOBILE_MIN_VERSION_ANDROID_LOGIN?: string;
  MOBILE_MIN_VERSION_ANDROID_OPEN_TURNO?: string;
  MOBILE_MIN_VERSION_IOS?: string;
  MOBILE_MIN_VERSION_IOS_LOGIN?: string;
  MOBILE_MIN_VERSION_IOS_OPEN_TURNO?: string;
}

function normalizeOptionalString(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function parseVersionParts(version: string): number[] {
  return (version.match(/\d+/g) ?? [])
    .map((part) => Number(part))
    .filter((part) => Number.isFinite(part));
}

function compareVersions(current: string, minimum: string): number {
  const currentParts = parseVersionParts(current);
  const minimumParts = parseVersionParts(minimum);

  if (!currentParts.length || !minimumParts.length) {
    throw AppError.internal('Configuração inválida para bloqueio de versão do app');
  }

  const maxLength = Math.max(currentParts.length, minimumParts.length);
  for (let idx = 0; idx < maxLength; idx += 1) {
    const currentPart = currentParts[idx] ?? 0;
    const minimumPart = minimumParts[idx] ?? 0;

    if (currentPart > minimumPart) return 1;
    if (currentPart < minimumPart) return -1;
  }

  return 0;
}

@Injectable()
export class MobileAppVersionGateService {
  assertSupportedVersion(input: MobileAppVersionGateInput): void {
    assertMobileAppVersionSupported(env, input);
  }
}

export function assertMobileAppVersionSupported(
  config: MobileAppVersionGateConfig,
  input: MobileAppVersionGateInput,
): void {
  const platform = normalizePlatform(input.plataformaApp);
  const minimumVersion = resolveMinimumVersion(config, platform, input.action);

  if (!minimumVersion) {
    return;
  }

  const currentVersion = normalizeOptionalString(input.versaoApp);
  const actionLabel =
    input.action === 'login' ? 'login' : 'abertura de turno';

  if (!currentVersion) {
    throw AppError.forbidden(
      `Versão do aplicativo é obrigatória para ${actionLabel}. Atualize o app e tente novamente.`,
    );
  }

  if (compareVersions(currentVersion, minimumVersion) < 0) {
    throw AppError.forbidden(
      `Versão do aplicativo não suportada para ${actionLabel}. Mínima exigida para ${platform}: ${minimumVersion}.`,
    );
  }
}

function normalizePlatform(platform?: string | null): MobilePlatform {
  return platform?.trim().toLowerCase() === 'ios' ? 'ios' : 'android';
}

function resolveMinimumVersion(
  config: MobileAppVersionGateConfig,
  platform: MobilePlatform,
  action: MobileGateAction,
): string | undefined {
  const minimumVersion =
    platform === 'ios'
      ? action === 'login'
        ? config.MOBILE_MIN_VERSION_IOS_LOGIN ?? config.MOBILE_MIN_VERSION_IOS
        : config.MOBILE_MIN_VERSION_IOS_OPEN_TURNO ?? config.MOBILE_MIN_VERSION_IOS
      : action === 'login'
        ? config.MOBILE_MIN_VERSION_ANDROID_LOGIN ?? config.MOBILE_MIN_VERSION_ANDROID
        : config.MOBILE_MIN_VERSION_ANDROID_OPEN_TURNO ?? config.MOBILE_MIN_VERSION_ANDROID;

  return normalizeOptionalString(minimumVersion);
}
