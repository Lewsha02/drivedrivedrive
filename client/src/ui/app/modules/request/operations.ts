import { store } from 'core/shared/store';
import { GetRequest } from 'core/models/api';
import { api, loadData } from 'core/app/api';

const state = () => store.getState();

export const getRequestState = async (requestId: string, noUserId?: boolean) => {
  try {
    const payload: GetRequest = {
      userId: noUserId ? null : state().authInfo && state().authInfo.userId || '',
      requestId
    };
    await loadData('requsetState', () => api.request.getRequestState(payload));
  } catch (error) {
    throw error;
  }
};

export const getRequest = async (requestId: string) => {
  try {
    await loadData('selectedRequest', () => api.request.getRequest(requestId));
  } catch (error) {
    throw error;
  }
};
