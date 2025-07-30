export type UploadedFile = {
  url: string;
  fileId: string;
  name: string;
  fileType: string;
};

export type Location = {
  lat: number;
  lng: number;
};

export type LocationChangeHandler = (pos: Location) => void;