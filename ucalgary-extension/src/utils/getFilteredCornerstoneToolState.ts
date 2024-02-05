import OHIF from '@ohif/core';
import * as cornerstone3DTools from '@cornerstonejs/tools';
import dcmjs from 'dcmjs';
import { FIDUCIAL_TOOL_NAME } from '../tools/FiducialTool';

const PROBE_TOOL_NAME = cornerstone3DTools.ProbeTool.toolName;

const { log } = OHIF;
const { CodeScheme: Cornerstone3DCodingScheme } = dcmjs.adapters.Cornerstone3D;

/**
 * Note the underlying support tool type in dcmjs is the `Probe`, which has the same data structure,
 * just renders differently. so here we map the `Fiducial` to the `Probe`.
 */
function getFilteredCornerstoneToolState(measurementData) {
  const filteredToolState = {};

  function addToFilteredToolState(annotation, toolType) {
    if (!annotation.metadata?.referencedImageId) {
      log.warn(`[DICOMSR] No referencedImageId found for ${toolType} ${annotation.id}`);
      return;
    }

    const imageId = annotation.metadata.referencedImageId;

    if (!filteredToolState[imageId]) {
      filteredToolState[imageId] = {};
    }

    const imageIdSpecificToolState = filteredToolState[imageId];

    if (!imageIdSpecificToolState[toolType]) {
      imageIdSpecificToolState[toolType] = {
        data: [],
      };
    }

    const measurementDataI = measurementData.find(md => md.uid === annotation.annotationUID);
    const toolData = imageIdSpecificToolState[toolType].data;

    const findingSites = [];
    let finding;

    // if (measurementDataI.label) {
    //   // NOTE -> We use the CORNERSTONEJS coding schemeDesignator which we have
    //   // defined in the dcmjs adapters
    //   findingSites.push({
    //     CodeValue: Cornerstone3DCodingScheme.codeValues.CORNERSTONEFREETEXT,
    //     CodingSchemeDesignator: Cornerstone3DCodingScheme.CodingSchemeDesignator,
    //     CodeMeaning: measurementDataI.label,
    //   });
    // }

    // if (measurementDataI.finding) {
    //   const ref = measurementDataI.finding.ref.split(':');

    //   finding = {
    //     CodingSchemeDesignator: ref[0],
    //     CodeValue: ref[1],
    //     CodeMeaning: measurementDataI.finding.text,
    //   };
    // } else if (measurementDataI.findingSite) {
    //   const ref = measurementDataI.findingSite.ref.split(':');

    //   findingSites.push({
    //     CodingSchemeDesignator: ref[0],
    //     CodeValue: ref[1],
    //     CodeMeaning: measurementDataI.findingSite.text,
    //   });
    // }

    const measurement = Object.assign({}, annotation, {
      finding,
      findingSites,
    });

    toolData.push(measurement);
  }

  const uidFilter = measurementData.map(md => md.uid);
  const uids = uidFilter.slice();

  const annotationManager = cornerstone3DTools.annotation.state.getAnnotationManager();
  const framesOfReference = annotationManager.getFramesOfReference();

  for (let i = 0; i < framesOfReference.length; i++) {
    const frameOfReference = framesOfReference[i];

    const frameOfReferenceAnnotations = annotationManager.getAnnotations(frameOfReference);

    const toolTypes = Object.keys(frameOfReferenceAnnotations);

    for (let j = 0; j < toolTypes.length; j++) {
      const toolType = toolTypes[j];

      const annotations = frameOfReferenceAnnotations[toolType];

      const mappedToolType = toolType === FIDUCIAL_TOOL_NAME ? PROBE_TOOL_NAME : toolType;

      if (annotations) {
        for (let k = 0; k < annotations.length; k++) {
          const annotation = annotations[k];
          const uidIndex = uids.findIndex(uid => uid === annotation.annotationUID);

          if (uidIndex !== -1) {
            addToFilteredToolState(annotation, mappedToolType);
            uids.splice(uidIndex, 1);

            if (!uids.length) {
              return filteredToolState;
            }
          }
        }
      }
    }
  }

  return filteredToolState;
}

export default getFilteredCornerstoneToolState;
