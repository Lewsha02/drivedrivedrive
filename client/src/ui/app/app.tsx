import * as React from 'react';
import * as ReactDOM from 'react-dom';
import 'core/shared/i18n';
import { Provider as Redux } from 'react-redux';
import { Provider as Fela, ThemeProvider } from 'react-fela';
import { IRenderer as FelaRenderer } from 'fela';
import { configureFela } from './fela';
import { driveTheme } from 'ui/shared/driveUI';
import { ConnectedRouter } from 'connected-react-router';
import { injectReducer, store } from 'core/shared/store';
import { history } from 'ui/app/history';
import { AppEntrySettings } from 'core/models/app';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import { AppRoot } from './components/AppRoot';
import { init } from 'core/app/init';
import { uiReducers } from 'core/app/reducer';
import * as common from 'core/shared/common';
import * as moment from 'moment';

const renderApp = (fela: {
  renderer: FelaRenderer;
  mountNode: HTMLElement;
}) => {
  ReactDOM.render(
    <Redux store={store}>
      <Fela renderer={fela.renderer} mountNode={fela.mountNode}>
        <ThemeProvider theme={driveTheme}>
          <MuiThemeProvider>
            <ConnectedRouter history={history}>
              <AppRoot />
            </ConnectedRouter>
          </MuiThemeProvider>
        </ThemeProvider>
      </Fela>
    </Redux>,
    document.getElementById('app')
  );
};

export const entryApplication = async (args: AppEntrySettings) => {
  console.debug('AppEntry args:', args);
  await common.setLocale(args.language);
  injectReducer('ui', uiReducers);
  await init();

  store.dispatch({
    type: 'appInit',
    isMobile: args.isMobile
  });


  moment.locale(store.getState().localAppState.lang);

  const fela = configureFela('stylesheet');
  renderApp(fela);
};
