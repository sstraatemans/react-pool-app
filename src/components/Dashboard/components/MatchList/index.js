import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import {
  firebaseConnect,
  isLoaded,
  isEmpty,
  populate
} from 'react-redux-firebase';
import Match from './../../../Match';

class MatchList extends Component {
  render() {
    if (isLoaded(this.props.matches) && !isEmpty(this.props.matches)) {
      return (
        <div>
          {Object.entries(this.props.matches).map(([matchId, match]) => {
            return (
              <Match
                key={matchId}
                matchId={matchId}
                match={match}
                auth={this.props.auth}
              />
            );
          })}
        </div>
      );
    } else {
      return <div />;
    }
  }
}

const populates = [
  { child: 'competitors', root: 'users', keyProp: 'uid' } // replace owner with user object
];

const enhance = compose(
  firebaseConnect(props => [
    { path: '/matches', queryParams: ['orderByChild=finishedAt'], populates },
    { path: 'auth' }
  ]),
  connect((state, props) => ({
    matches: populate(state.firebase, 'matches', populates),
    auth: state.firebase.auth
  }))
);
export const MatchListTest = MatchList;
export default enhance(MatchList);