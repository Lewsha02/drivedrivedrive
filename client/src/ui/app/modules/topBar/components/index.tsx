import * as React from 'react';
import AppBar from 'material-ui/AppBar';
import IconButton from 'material-ui/IconButton';
import NavigationLogo from 'material-ui/svg-icons/notification/drive-eta';
import { changeUrl } from 'ui/app/operations';
import { AppState } from 'core/models/app';
import { returntypeof } from 'react-redux-typescript';
import { compose } from 'redux';
import { connect as ReduxConnect } from 'react-redux';
import DroppingMenu from './DroppingMenu';

const MOBILE_SCREEN_WIDTH = 450;
const mapStateToProps = (state: AppState) => ({
  path: state.router.location.pathname,
  isMobile: state.screen.width <= MOBILE_SCREEN_WIDTH
});
const StateProps = returntypeof(mapStateToProps);
type Props = typeof StateProps;

class Index extends React.Component<Props> {

  handleHome = () => changeUrl('/');

  get titleChange() {
    const { path } = this.props;
    const splitPath = path.split('/');
    switch (splitPath[1]) {
      case 'signin':
        return 'Вход в профиль';

      case 'join':
        return 'Регистрация';

      case 'forgot-password' || 'reset-password':
        return 'Восстановление пароля';

      case 'me':
        return 'Профиль';

      case 'request':
        return 'Трансфер';

      default:
        return '';
    }
  }

  render() {
    const { isMobile } = this.props;
    return (
      <AppBar
        titleStyle={{maxWidth: isMobile ? 200 : 'unset'}}
        title={this.titleChange}
        iconElementLeft={<IconButton><NavigationLogo onClick={this.handleHome} /></IconButton>}
        iconElementRight={<DroppingMenu />}
      />
    )
  }
}

export default compose(
  ReduxConnect(mapStateToProps)
)(Index);
