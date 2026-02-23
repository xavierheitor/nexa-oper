export const LOCATION_UPLOAD_REPOSITORY = Symbol('LOCATION_UPLOAD_REPOSITORY');

export interface LocationTurnoSnapshotPort {
  id: number;
  dataFim: Date | null;
}

export interface CreateLocationRecordPort {
  turnoId: number;
  veiculoRemoteId: number | null;
  equipeRemoteId: number | null;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  provider: string | null;
  batteryLevel: number | null;
  tagType: string | null;
  tagDetail: string | null;
  capturedAt: Date;
  signature: string;
  createdBy: string;
}

export interface LocationUploadRepositoryPort {
  findTurnoById(turnoId: number): Promise<LocationTurnoSnapshotPort | null>;
  createLocation(data: CreateLocationRecordPort): Promise<void>;
}
