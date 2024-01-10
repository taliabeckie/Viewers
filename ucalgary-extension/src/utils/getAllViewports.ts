import _getViewportEnabledElement from './getViewportEnabledElement';

/** Get an array of all the enabled elements (viewports)
 * @return (object[]) Enabled elements array.
 */
export default () => {
  const ret = [];
  for (let i = 0; i < 128; i++) {
    const viewport = _getViewportEnabledElement(i);
    if (!viewport) {
      break;
    }
    ret.push(viewport);
  }
  return ret;
};
