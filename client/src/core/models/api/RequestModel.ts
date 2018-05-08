export interface StateRequest {
  Rstatus: Rstatus;
}

export const enum Rstatus {
  OPEN = 0,
  ASSIGNED = 1,
  CLOSED = 2,
  UNAUTHORIZED = -1,
  FORBIDDEN = -2
}

export interface GetRequest {
  requestId: string;
  userId: string;
}

export interface NewRequest {
  count: number;
  from: string;
  to: string;
  date: any;
  time: string;
  comment?: string
}

export interface AssignRequest {
  requestPrice: number
  requestId: string
}
