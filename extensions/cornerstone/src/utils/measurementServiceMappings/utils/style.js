import { annotation } from '@cornerstonejs/tools';

const defaultColorPropKeys = ['color', 'textBoxColor'];
const allColorPropKeys = [
  'color',
  'colorHighlighted',
  'colorLocked',
  'colorSelected',
  'textBoxColor',
  'textBoxColorHighlighted',
  'textBoxColorLocked',
  'textBoxColorSelected',
];

const defaultLineDashPropKeys = ['lineDash'];
const allLineDashPropKeys = [
  'lineDash',
  'lineDashHighlighted',
  'lineDashLocked',
  'lineDashSelected',
];

/**
 * Get annotation color (Factory to cs3d).
 * @param {Object} cs3dAnnotationUID CS3D annotation uid.
 * @returns string representing the color
 */
function getAnnotationColor(cs3dAnnotationUID) {
  const specifications = {
    annotationUID: cs3dAnnotationUID,
  };

  return annotation.config.style.getStyleProperty('color', specifications);
}

/**
 * Sets the annotation color.
 * CS3D supports different approaches of setting colors. This factory api reduces it to only color and textColor annotation properties cases.
 * @param {Object} cs3dAnnotationUID CS3D annotation uid.
 * @param {String} newColorValue new color
 * @param {boolean} [anyState] tell whether it has to apply to any state or not.
 */
function setAnnotationColor(
  cs3dAnnotationUID,
  newColorValue,
  anyState = false
) {
  if (!newColorValue || !cs3dAnnotationUID) {
    return;
  }

  const newStyle = (anyState ? allColorPropKeys : defaultColorPropKeys).reduce(
    (curr, key) => ({ ...curr, [key]: newColorValue }),
    {}
  );
  const currentAnnotationStyles =
    annotation.config.style.getAnnotationToolStyles(cs3dAnnotationUID) || {};
  const mergedStyle = { ...currentAnnotationStyles, ...newStyle };
  annotation.config.style.setAnnotationStyles(cs3dAnnotationUID, mergedStyle);
}

function setAnnotationLineDash(
  cs3dAnnotationUID,
  newLineDash,
  anyState = false
) {
  if (!newLineDash || !cs3dAnnotationUID) {
    return;
  }

  const newStyle = (anyState
    ? allLineDashPropKeys
    : defaultLineDashPropKeys
  ).reduce((curr, key) => ({ ...curr, [key]: newLineDash }), {});
  const currentAnnotationStyles =
    annotation.config.style.getAnnotationToolStyles(cs3dAnnotationUID) || {};
  const mergedStyle = { ...currentAnnotationStyles, ...newStyle };
  annotation.config.style.setAnnotationStyles(cs3dAnnotationUID, mergedStyle);
}

export { setAnnotationColor, getAnnotationColor, setAnnotationLineDash };
