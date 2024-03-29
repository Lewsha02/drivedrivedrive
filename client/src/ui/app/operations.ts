import { store } from 'core/shared/store';
import { push } from 'connected-react-router';
import { reset } from 'redux-form';

export const changeUrl = (url: string) => {
  store.dispatch(push(url));
};

export const resetForm = (form: string) =>
  store.dispatch(reset(form));
