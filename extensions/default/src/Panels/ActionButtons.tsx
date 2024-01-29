import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import { LegacyButton, LegacyButtonGroup } from '@ohif/ui';

//function ActionButtons({ onExportClick, onCreateReportClick }) {
function ActionButtons({ onRunAlgorithmClick, onCreateReportClick }) {
  const { t } = useTranslation('MeasurementTable');

  return (
    <React.Fragment>
      <LegacyButtonGroup
        color="black"
        size="inherit"
      >
        {/* TODO Revisit design of LegacyButtonGroup later - for now use LegacyButton for its children.*/}
        <LegacyButton
          className="px-2 py-2 text-base"
          // onClick={onExportClick}
          onClick={onRunAlgorithmClick}
        >
          {t('Run Algorithm')}
        </LegacyButton>
        <LegacyButton
          className="px-2 py-2 text-base"
          onClick={onCreateReportClick}
        >
          {t('Save Annotations')}
        </LegacyButton>
      </LegacyButtonGroup>
    </React.Fragment>
  );
}

ActionButtons.propTypes = {
  //onExportClick: PropTypes.func,
  onRunAlgorithmClick: PropTypes.func,
  onCreateReportClick: PropTypes.func,
};

ActionButtons.defaultProps = {
  //onExportClick: () => alert('Export'),
  onRunAlgorithmClick: () => alert('Export'),
  onCreateReportClick: () => alert('Create Report'),
};

export default ActionButtons;
