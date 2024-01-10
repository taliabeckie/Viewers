import * as cornerstone3D from '@cornerstonejs/core';
import { extensionUtils as cs3dExtensionUtils } from '@ohif/extension-cornerstone';

export default viewportIndex => {
  const { element } = cs3dExtensionUtils.getEnabledElement(viewportIndex) || {};
  const enabledElement = cornerstone3D.getEnabledElement(element);
  return enabledElement;
};
