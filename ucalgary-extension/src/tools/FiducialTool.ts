import { getEnabledElement } from '@cornerstonejs/core';
import {
  ProbeTool,
  drawing as cs3DToolsDrawing,
  cursors as cs3DToolsCursors,
  utilities as cs3DToolsUtilities,
  annotation as cs3DToolsAnnotation,
} from '@cornerstonejs/tools';
import { ProbeAnnotation } from '../../../node_modules/@cornerstonejs/tools/src/types/ToolSpecificAnnotationTypes';
import { EventTypes, SVGDrawingHelper } from '../../../node_modules/@cornerstonejs/tools/src/types';
import { StyleSpecifier } from '../../../node_modules/@cornerstonejs/tools/src/types/AnnotationStyle';
import type { Types } from '@cornerstonejs/core';
import {
  addAnnotation,
  getAnnotations,
  removeAnnotation,
} from '../../../node_modules/@cornerstonejs/tools/src/stateManagement/annotation/annotationState';
import { Annotations } from '@cornerstonejs/tools/dist/types/types';
import { MouseMoveEventType } from '@cornerstonejs/tools/dist/types/types/EventTypes';
import { composeInitialProps } from 'react-i18next';

const FIDUCIAL_TOOL_NAME = 'Fiducial';

/** @namespace CustomTools */
/**
 * Creates a new Fiducial Tool.
 * @class
 * @classdesc
 * This is a CS3D tool, defined at OHIF project level. We have follow all CS3D standard in other for this tool to coexist to native tools.
 * FiducialTool let you mark a point of interest and annotate (label/site/finding) it.
 * You can use FiducialTool in all perpendicular views (axial, sagittal, coronal).
 * Note: annotation tools in cornerstone3DTools exists in the exact location
 * in the physical 3d space, as a result, by default, all annotations that are
 * drawing in the same frameOfReference will get shared between viewports that
 * are in the same frameOfReference. Tool's text box are set by user.
 *
 * The resulting annotation's data and metadata (the
 * state of the viewport while drawing was happening) will get added to the
 * ToolState manager and can be accessed from the ToolState by calling getAnnotations
 * or similar methods.
 *
 * To use the FiducialTool, you first need to add it to cornerstoneTools, then create
 * a toolGroup and add the FiducialTool to it. Finally, setToolActive on the toolGroup
 *
 * ```js
 * cornerstoneTools.addTool(FiducialTool)
 *
 * const toolGroup = ToolGroupManager.createToolGroup('toolGroupId')
 *
 * toolGroup.addTool(FiducialTool.toolName)
 *
 * toolGroup.addViewport('viewportId', 'renderingEngineId')
 *
 * toolGroup.setToolActive(FiducialTool.toolName, {
 *   bindings: [
 *    {
 *       mouseButton: MouseBindings.Primary, // Left Click
 *     },
 *   ],
 * })
 * ```
 *
 * Read more in the Docs section of the website.
 *
 */

export default class FiducialTool extends ProbeTool {
  static toolName = FIDUCIAL_TOOL_NAME;

  eventDispatchDetail: {
    viewportId: string;
    renderingEngineId: string;
  };
  isDrawing: boolean;
  isHandleOutsideImage: boolean;

  constructor(
    toolProps = {},
    defaultToolProps = {
      supportedInteractionTypes: ['Mouse', 'Touch'],
      configuration: {
        shadow: true,
        preventHandleOutsideImage: false,
        handleRadius: 2,
      },
    }
  ) {
    super(toolProps, defaultToolProps);
  }

  /**
   * Based on the current position of the mouse and the current imageId to create
   * a Fiducial Annotation and stores it in the annotationManager
   *
   * @param evt -  EventTypes.NormalizedMouseEventType
   * @returns The annotation object.
   *
   */
  addNewAnnotation = (evt: EventTypes.InteractionEventType) => {
    const eventDetail = evt.detail;
    const { currentPoints, element } = eventDetail;

    if (!element || !element.dataset) {
      console.error(
        'The element object is not valid or does not have the necessary data attributes.'
      );
      return;
    }

    const pointsList = [currentPoints];
    const worldPosPoints1 = pointsList.map(points => points.world);
    const worldPosPoints = this.correctFormatting(worldPosPoints1);
    const enabledElement = getEnabledElement(element);
    const { viewport, renderingEngine } = enabledElement;
    this.isDrawing = true;

    const camera = viewport.getCamera();
    const { viewPlaneNormal, viewUp } = camera;

    const referencedImageId = this.getReferencedImageId(
      viewport,
      worldPosPoints[0],
      viewPlaneNormal,
      viewUp
    );

    const annotation = {
      highlighted: true,
      invalidated: false,
      isVisible: true,
      metadata: {
        toolName: this.getToolName(),
        viewPlaneNormal: [...viewPlaneNormal] as Types.Point3,
        viewUp: [...viewUp] as Types.Point3,
        FrameOfReferenceUID: viewport.getFrameOfReferenceUID(),
        referencedImageId,
      },
      data: {
        label: '',
        handles: { points: [[...worldPosPoints] as Types.Point3] },
        cachedStats: {},
      },
    };

    if (!annotation) {
      return;
    }

    cs3DToolsAnnotation.state.addAnnotation(annotation, element);

    const viewportIdsToRender = cs3DToolsUtilities.viewportFilters.getViewportIdsWithToolToRender(
      element,
      this.getToolName()
    );

    this.editData = {
      annotation,
      newAnnotation: true,
      viewportIdsToRender,
    };
    this._activateModify(element);

    cs3DToolsCursors.elementCursor.hideElementCursor(element);

    evt.preventDefault();

    cs3DToolsUtilities.triggerAnnotationRenderForViewportIds(renderingEngine, viewportIdsToRender);

    return annotation;
  };

  /**
   * It is used to draw the annotation in each request animation frame.
   *
   * @param enabledElement - The Cornerstone's enabledElement.
   * @param svgDrawingHelper - The svgDrawingHelper providing the context for drawing.
   */

  renderAnnotation = (
    enabledElement: Types.IEnabledElement,
    svgDrawingHelper: SVGDrawingHelper
  ): boolean => {
    const { viewport } = enabledElement;
    const { element } = viewport;

    let annotations = cs3DToolsAnnotation.state.getAnnotations(this.getToolName(), element);

    if (!annotations?.length) {
      return;
    }

    annotations = this.filterInteractableAnnotationsForElement(element, annotations);

    if (!annotations?.length) {
      return;
    }

    const targetId = this.getTargetId(viewport);
    const renderingEngine = viewport.getRenderingEngine();

    const styleSpecifier: StyleSpecifier = {
      toolGroupId: this.toolGroupId,
      toolName: this.getToolName(),
      viewportId: enabledElement.viewport.id,
    };

    const { handleRadius } = this.configuration;

    for (let i = 0; i < annotations.length; i++) {
      const annotation = annotations[i];
      const annotationUID = annotation.annotationUID;
      const data = annotation.data;

      const point = data.handles.points[0];
      const newpoint = this.correctFormatting(point);
      const canvasCoordinates = viewport.worldToCanvas(newpoint);
      styleSpecifier.annotationUID = annotationUID;

      const color = this.getStyle('color', styleSpecifier, annotation);

      // If rendering engine has been destroyed while rendering
      if (!viewport.getRenderingEngine()) {
        console.warn('Rendering Engine has been destroyed');
        return;
      }

      const handleGroupUID = '0';

      cs3DToolsDrawing.drawHandles(
        svgDrawingHelper,
        annotationUID,
        handleGroupUID,
        [canvasCoordinates], // into [,,]
        { color, handleRadius }
      );

      const textLines = this._getTextLines(data, targetId);
      if (textLines) {
        const textCanvasCoordinates = [canvasCoordinates[0], canvasCoordinates[1]];

        const option = {
          ...this.getLinkedTextBoxStyle(styleSpecifier, annotation),
          padding: 5,
        };

        const textUID = '0';
        cs3DToolsDrawing.drawTextBox(
          svgDrawingHelper,
          annotationUID,
          textUID,
          textLines,
          [textCanvasCoordinates[0], textCanvasCoordinates[1]],
          option
        );
      }
    }
  };

  _getTextLines(data, targetId) {
    return data.label ? [data.label] : undefined;
  }

  correctFormatting(input) {
    if (Array.isArray(input) && input.length === 1 && input[0].length === 3) {
      return input[0];
    }
    return input;
  }
}

export { FIDUCIAL_TOOL_NAME };
