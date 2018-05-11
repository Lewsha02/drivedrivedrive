import { AppState } from 'core/models/app';
import { connect as ReduxConnect } from 'react-redux';
import { connect as FelaConnect, FelaRule, FelaStyles } from 'react-fela';
import { returntypeof } from 'react-redux-typescript';
import * as React from 'react';
import { compose } from 'redux';
import Paper from 'material-ui/Paper';
import { getRequestId, getRequestQuery } from '../selectors';
import { getRequestToRate } from '../operations';
import { Rstatus } from 'core/models/api';
import Form from './Form';


const mapStateToProps = (state: AppState) => ({
  requestId: getRequestId(state),
  query: getRequestQuery(state),
  getRequestStatus: state.ui.api.requsetState.result,
});

const StateProps = returntypeof(mapStateToProps);
type Props = typeof StateProps;
type FelaProps = FelaStyles<typeof mapStylesToProps>;
class Index extends React.Component<Props & FelaProps> {

  async componentDidMount() {
    if (this.props.requestId) {
      await getRequestToRate(this.props.requestId, this.props.query);
    }
  }

  render() {
    const { styles, getRequestStatus } = this.props;
    const ratingRequest = getRequestStatus && getRequestStatus.Rstatus === Rstatus.RATING;
    const invalidRequest = getRequestStatus && getRequestStatus.Rstatus === Rstatus.INVALID;
    const ratedRequest = getRequestStatus && getRequestStatus.Rstatus === Rstatus.RATED;

    return (
        <div className={styles.container}>
          <Paper style={{margin: '1rem'}} zDepth={2}>
            {ratingRequest &&
            <div className={styles.headBox}>
              <h1 className={styles.texts}>Оцените Вашу поездку!</h1>
              <Form />
            </div>}
            {ratedRequest &&
              <div className={styles.headBox}>
                <h1 className={styles.texts}>Спасибо за Вашу оценку</h1>
              </div>
            }
            {invalidRequest &&
            <div className={styles.headBox}>
              <h1 className={styles.texts}>Ошибка: недействительная ссылка</h1>
            </div>}
          </Paper>
        </div>
    );
  }
}

const container: FelaRule<Props> = () => ({
  height: '100%',
  width: '100%'
});

const headBox: FelaRule<Props> = () => ({
  display: 'flex',
  flexDirection: 'column',
  fontSize: '1rem',
  padding: '1rem'
});

const texts: FelaRule<Props> = () => ({
  margin: '1rem auto'
});

const mapStylesToProps = {
  container,
  headBox,
  texts
};

export default compose (
  ReduxConnect(mapStateToProps),
  FelaConnect(mapStylesToProps),
)(Index);