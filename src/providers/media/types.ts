export interface StoredMedia {
  url: string;
  storageKey: string;
  provider: string;
}

export interface MediaProvider {
  readonly name: string;
  storeVehiclePhoto(input: {
    data: Buffer;
    contentType: string;
    extension: string;
  }): Promise<StoredMedia>;
  delete(storageKey: string): Promise<void>;
}
