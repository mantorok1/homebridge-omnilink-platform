export interface IStatus {
  equals(status: IStatus | undefined): boolean;
  getKey(id: number): string;
}