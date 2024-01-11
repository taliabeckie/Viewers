import { annotation } from "@cornerstonejs/tools";

/**
 * Check whether an annotation from imaging library is visible or not.
 * @param {string} cs3dAnnotationUID imaging library annotation data'uid.
 * @returns boolean
 */
function isAnnotationVisible(cs3dAnnotationUID) {
  return annotation.visibility.isAnnotationVisible(cs3dAnnotationUID);
}
/**
 * Sets the annotation visibility (visible property) by its annotationUID.
 *
 * @param {string} cs3dAnnotationUID imaging library annotation data'uid.
 * @param {boolean} visible new visible property value
 */
function setAnnotationVisibility(cs3dAnnotationUID, visible) {

  const isCurrentVisible = isAnnotationVisible(cs3dAnnotationUID);
  // branch cut, avoid invoking imaging library unnecessarily.
  if (isCurrentVisible !== visible) {
    annotation.visibility.setAnnotationVisibility(cs3dAnnotationUID, visible)
  }
}

export {
  setAnnotationVisibility,
  isAnnotationVisible
}
