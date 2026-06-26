import { SetMetadata } from '@nestjs/common';

export const BYPASS_ENVELOPE_KEY = 'bypass_envelope';
export const BypassEnvelope = () => SetMetadata(BYPASS_ENVELOPE_KEY, true);
