import * as cornerstone3D from '@cornerstonejs/core';
import _getViewportEnabledElement from './getViewportEnabledElement';

export function _getViewport(viewportIndex) {
  const enabledElement = _getViewportEnabledElement(viewportIndex);

  if (!enabledElement) {
    return;
  }

  const { viewport } = enabledElement;

  if (!(viewport instanceof cornerstone3D.StackViewport)) {
    throw new Error('volume viewport is not supported yet');
  }

  return viewport;
}
