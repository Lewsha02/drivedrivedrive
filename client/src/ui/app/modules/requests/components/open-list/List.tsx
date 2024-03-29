import * as React from 'react';
import { composeTable, tableConnect } from 'ui/app/modules/tables';
import Loader from 'ui/app/components/loader';
import { getOpenRequests } from '../../operations';
import { getOpenRequestsData } from '../../selectors';
import { TableRequest } from 'core/models/api';
import { changeUrl } from 'ui/app/operations';

const TC = composeTable<TableRequest>({
  model: [{
    label: 'app::common:from',
    dataKey: 'from'
  }, {
    label: 'app::common:to',
    dataKey: 'to'
  }, {
    label: 'app::common:date',
    dataKey: 'date'
  }, {
    label: 'app::common:time',
    dataKey: 'time'
  }],
  showRowDividers: true,
  showRowArrows: true,
  showHeaderDividers: true,
  showHeaderSortControls: true,
  onRowClick: ({ rowData }) => {
    changeUrl(`/request/${rowData.id}`);
  }
});

const OpenRequestsConnectedList = tableConnect({
  dataName: 'openRequests',
  tableName: 'openRequests'
})(TC);

const OpenRequestsContainer = Loader({
  loadData: getOpenRequests,
  dataSelector: getOpenRequestsData,
  component: OpenRequestsConnectedList
});

export const OpenRequestsList: React.SFC = () => {
  return <OpenRequestsContainer />;
};
