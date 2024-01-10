function assertScorePercentage(value) {
  const num = Number(value);
  return typeof num === 'number' && num >= 0 && num <= 100;
}

function assertRGBColorString(color) {
  const colorRangeRegExp = '\\b([01]?[0-9][0-9]?|2[0-4][0-9]|25[0-5])';
  const rgbRegExp = new RegExp(
    `^rgb\\(${colorRangeRegExp},${colorRangeRegExp},${colorRangeRegExp}\\)`
  );

  return rgbRegExp.test(color);
}

export function ColorRangePropType(props, propName, componentName) {
  const value = props[propName];

  if (
    typeof value !== 'object' ||
    !Array.isArray(value) ||
    value.length !== 2 ||
    !assertScorePercentage(value[0]) ||
    !assertRGBColorString(value[1])
  ) {
    return new Error(
      'Invalid prop `' +
        propName +
        '` supplied to' +
        ' `' +
        componentName +
        '`. Validation failed.'
    );
  }
}
export function ItemScorePropType(props, propName, componentName) {
  const value = props[propName];
  if (!assertScorePercentage(value)) {
    return new Error(
      'Invalid prop `' +
        propName +
        '` supplied to' +
        ' `' +
        componentName +
        '`. Validation failed.'
    );
  }
}
