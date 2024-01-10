import React from 'react';
import PropTypes from 'prop-types';
import { ColorRangePropType, ItemScorePropType } from './ResultCharPropTypes';
import HorizontalChartItem from './HorizontalChartItem';

function shouldShowChart({ title, items }) {
  return title && items && Array.isArray(items);
}

export default function ResultChart({ title, items, colorify }) {
  if (!shouldShowChart({ title, items })) {
    return;
  }

  return (
    <div className="text-primary-light">
      <div className="chartTitle text-sm text-primary-active py-1">{title}</div>
      <div className="chartItems overflow-hidden ohif-scrollbar">
        {items.map((item, index) =>
          HorizontalChartItem({ item, key: index, colorify })
        )}
      </div>
    </div>
  );
}

ResultChart.defaultProps = {
  title: '',
  items: [],
  colorify: [
    [0, 'rgb(255,0,0)'],
    [25, 'rgb(255,255,0)'],
    [50, 'rgb(0,255,0)'],
    [75, 'rgb(0,255,0)'],
  ],
};

ResultChart.propTypes = {
  title: PropTypes.string,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      text: PropTypes.string,
      score: ItemScorePropType,
    })
  ),
  colorify: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.arrayOf(ColorRangePropType),
  ]),
};
