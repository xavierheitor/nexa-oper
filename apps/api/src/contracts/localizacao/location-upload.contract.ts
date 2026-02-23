export interface LocationUploadRequestContract {
  turnoId: number;
  latitude: number;
  longitude: number;
  veiculoRemoteId?: number;
  equipeRemoteId?: number;
  accuracy?: number;
  provider?: string;
  batteryLevel?: number;
  tagType?: string;
  tagDetail?: string;
  capturedAt?: string;
}

export interface LocationUploadResponseContract {
  status: 'ok';
  alreadyExisted: boolean;
}
