import { getEnabledElement } from '@cornerstonejs/core';
import {
  ProbeTool,
  drawing as cs3DToolsDrawing,
  cursors as cs3DToolsCursors,
  utilities as cs3DToolsUtilities,
  annotation as cs3DToolsAnnotation,
} from '@cornerstonejs/tools';

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
  addNewAnnotation = evt => {
    const eventDetail = evt.detail;
    const { currentPoints, element } = eventDetail;
    this.isDrawing = true;
    const annotation = this.newAnnotationFromPoints(element, [currentPoints]);

    if (!annotation) {
      return;
    }
    cs3DToolsAnnotation.state.addAnnotation(element, annotation);

    const enabledElement = getEnabledElement(element);
    const { renderingEngine } = enabledElement;

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

  newAnnotationFromPoints = (element, pointsList = []) => {
    if (!pointsList.length) {
      return;
    }

    const worldPosPoints = pointsList.map(points => points.world);
    const enabledElement = getEnabledElement(element);
    const { viewport } = enabledElement;
    const camera = viewport.getCamera();
    const { viewPlaneNormal, viewUp } = camera;

    const referencedImageId = this.getReferencedImageId(
      viewport,
      worldPosPoints[0],
      viewPlaneNormal,
      viewUp
    );

    const annotation = {
      invalidated: false,
      highlighted: true,
      metadata: {
        toolName: this.getToolName(),
        viewPlaneNormal: [...viewPlaneNormal],
        viewUp: [...viewUp],
        FrameOfReferenceUID: viewport.getFrameOfReferenceUID(),
        referencedImageId,
      },
      data: {
        label: '',
        handles: { points: [...worldPosPoints] },
      },
    };

    return annotation;
  };

  /**
   * It is used to draw the annotation in each request animation frame.
   *
   * @param enabledElement - The Cornerstone's enabledElement.
   * @param svgDrawingHelper - The svgDrawingHelper providing the context for drawing.
   */
  renderAnnotation = (enabledElement, svgDrawingHelper) => {
    const { viewport } = enabledElement;
    const { element } = viewport;

    let annotations = cs3DToolsAnnotation.state.getAnnotations(element, this.getToolName());

    if (!annotations?.length) {
      return;
    }

    annotations = this.filterInteractableAnnotationsForElement(element, annotations);

    if (!annotations?.length) {
      return;
    }

    const targetId = this.getTargetId(viewport);
    const renderingEngine = viewport.getRenderingEngine();

    const styleSpecifier = {
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
      const canvasCoordinates = viewport.worldToCanvas(point);
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
        [canvasCoordinates],
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
}

export { FIDUCIAL_TOOL_NAME };
