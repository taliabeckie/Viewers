import React from 'react';
import PropTypes from 'prop-types';

function ResultReportItemValues({ values, valuesClassName = '' }) {
  if (Array.isArray(values)) {
    return (
      <div className={`${valuesClassName} values flex flex-col`}>
        {values.map((valueItem, index) => (
          <div className="value" key={index}>
            {valueItem}
          </div>
        ))}
      </div>
    );
  }
}

ResultReportItemValues.propTypes = {
  values: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  ).isRequired,
  valuesClassName: PropTypes.string,
};

export default function ResultReportItem({ reportInfos }) {
  return (
    reportInfos.length && (
      <div className="text-primary-light text-sm pb-3">
        <div className="reportItems">
          <div className="flex flex-col items-center">
            {reportInfos.map((info, index) => (
              <div
                className="info flex flex-row justify-start w-full pt-1"
                key={index}
              >
                <div className="label min-w-32 max-w-32">{info.label}</div>
                <ResultReportItemValues
                  values={info.values}
                  valuesClassName={info.valuesClassName}
                ></ResultReportItemValues>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  );
}

ResultReportItem.defaultProps = {
  reportInfos: [],
};

ResultReportItem.propTypes = {
  reportInfos: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      values: PropTypes.arrayOf(
        PropTypes.oneOfType([PropTypes.string, PropTypes.number])
      ),
      valuesClassName: PropTypes.string,
    })
  ),
};
