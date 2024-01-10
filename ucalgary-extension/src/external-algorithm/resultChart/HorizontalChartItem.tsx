import React from 'react';
import PropTypes from 'prop-types';
import { Tooltip } from '@ohif/ui';
import { ColorRangePropType, ItemScorePropType } from './ResultCharPropTypes';

const LAYOUT = {
  LABEL_WIDTH: 25,
  BAR_WIDTH: 75, //complement of LABEL_WIDTH to 100
};

/**
 * Returns an array that contains the floor/ceil values (indexes) of the given value.
 * I.e floor is the greatest value (from array) less than or equal to the param value and ceil is the least value (from array) greater than or equal to the param value.
 *
 * @param array array of numbers.
 * @param value value to be evaluated (score)
 * @returns array with floor and ceil indexes.
 */
function findFloorCeilIndexes(array, value, maxValue = Infinity) {
  let index = 0;
  let minDiff = maxValue;
  let minIndex = index;

  for (index; index < array.length; index++) {
    let diff = Math.abs(value - array[index]);
    if (diff === 0) {
      break;
    }

    if (diff < minDiff) {
      minDiff = diff;
      minIndex = index;
    }
  }

  if (array[minIndex] === value) {
    return [minIndex, minIndex];
  }

  if (array[minIndex] < value) {
    return [minIndex, minIndex + 1];
  } else {
    return [minIndex - 1, minIndex];
  }
}

/**
 * Returns the color from colorsTable. The result will be the color refereed to a value that is the floor (on colorsTable space) value of valuePct.
 *
 * @param colorsTable 2d array of thresholds value and colors
 * @param valuePct value to be evaluated
 * @returns
 */
function getColorFromThresholdsArray(colorsTable = [], valuePct = 0) {
  const colorsThresholdsArray = colorsTable.map(entry => entry[0]);
  const [floorIndex] = findFloorCeilIndexes(colorsThresholdsArray, valuePct);
  const response = (colorsTable[floorIndex] ?? colorsTable[0])[1];

  return response;
}

/**
 * Returns chart bar color for the given value. There is two approaches for that:
 *    - From function callback in case colorify is function
 *    - From finding the best position of value from the map of colors in case colorify is a 2d array of threshold value and color
 *
 * @param value - number value
 * @param item - chart bar item
 * @param colorify function or array of colors
 * @returns string with color
 */
function getCharBarItemColor(value, item, colorify) {
  if (typeof colorify === 'function') {
    return colorify(value, item) || '';
  }

  return getColorFromThresholdsArray(colorify, value);
}

function formatPct(value) {
  return `${value}%`;
}

/**
 * Returns Component to display an char item horizontally.
 *
 * @param props
 * @returns
 */
export default function HorizontalChartItem({ item, key, colorify }) {
  const { label, score, text } = item;

  const chartBarColor = getCharBarItemColor(score, item, colorify);
  const pctWidth = `${(score * LAYOUT.BAR_WIDTH) / 100}`;
  const toolTipText = text || label;

  return (
    <Tooltip
      key={key}
      position="bottom"
      content={`${toolTipText} ${formatPct(score)}`}
    >
      <div className="flex justify-between items-center h-6">
        <div
          className="chartLabel text-right truncate text-sm"
          style={{ width: formatPct(LAYOUT.LABEL_WIDTH) }}
        >
          {label}
        </div>
        <div
          className="chartBarWrapper h-6"
          style={{ width: formatPct(LAYOUT.BAR_WIDTH) }}
        >
          <div className="flex h-6 items-center">
            <div
              className="chartBar rounded max-h-5 h-5 mx-1.5"
              style={{
                backgroundColor: chartBarColor,
                width: formatPct(pctWidth),
              }}
            ></div>
            <div className="chartScore w-8 text-left text-xs">
              {formatPct(score)}
            </div>
          </div>
        </div>
      </div>
    </Tooltip>
  );
}

HorizontalChartItem.propTypes = {
  key: PropTypes.any.isRequired,
  item: PropTypes.shape({
    label: PropTypes.string,
    text: PropTypes.string,
    score: ItemScorePropType,
  }),
  colorify: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.arrayOf(ColorRangePropType),
  ]),
};
