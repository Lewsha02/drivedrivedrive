import * as models from 'core/models';

export type SharedState = {
  localAppState: models.LocalAppState,
  authInfo: models.AuthInfo
};


export type SharedDispatch =
  | { type: 'appInit', isMobile: boolean }
  | { type: 'setLoginProcessStep', step: number, failMsg?: string }
  | { type: 'setAuthInfo', payload: models.AuthInfo }
  | { type: 'removeAuthInfo' }
  | { type: 'setResourcesLanguage', payload: models.LanguageId }
;
