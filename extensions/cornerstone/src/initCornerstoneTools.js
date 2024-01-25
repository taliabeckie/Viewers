import {
  PanTool,
  WindowLevelTool,
  StackScrollTool,
  StackScrollMouseWheelTool,
  ZoomTool,
  VolumeRotateMouseWheelTool,
  MIPJumpToClickTool,
  LengthTool,
  RectangleROITool,
  EllipticalROITool,
  CircleROITool,
  BidirectionalTool,
  ArrowAnnotateTool,
  DragProbeTool,
  ProbeTool,
  AngleTool,
  CobbAngleTool,
  PlanarFreehandROITool,
  MagnifyTool,
  CrosshairsTool,
  SegmentationDisplayTool,
  init,
  addTool,
  annotation,
  ReferenceLinesTool,
  TrackballRotateTool,
  CircleScissorsTool,
  RectangleScissorsTool,
  SphereScissorsTool,
} from '@cornerstonejs/tools';

import FiducialTool from '../../../ucalgary-extension/src/tools/FiducialTool';
import CalibrationLineTool from './tools/CalibrationLineTool';
import ImageOverlayViewerTool from './tools/ImageOverlayViewerTool';
import { getCustomCornerstoneTools } from './registerCustomCornerstoneTools';
import { registerCustomCornerstoneTools } from '.';
import FiducialToolMappingFactory from '../../../ucalgary-extension/utils/measurementServiceMappings/Fiducial';

export default function initCornerstoneTools(configuration = {}) {
  CrosshairsTool.isAnnotation = false;
  ReferenceLinesTool.isAnnotation = false;

  init(configuration);
  addTool(PanTool);
  addTool(WindowLevelTool);
  addTool(StackScrollMouseWheelTool);
  addTool(StackScrollTool);
  addTool(ZoomTool);
  addTool(ProbeTool);
  addTool(VolumeRotateMouseWheelTool);
  addTool(MIPJumpToClickTool);
  addTool(LengthTool);
  addTool(RectangleROITool);
  addTool(EllipticalROITool);
  addTool(CircleROITool);
  addTool(BidirectionalTool);
  addTool(ArrowAnnotateTool);
  addTool(DragProbeTool);
  addTool(AngleTool);
  addTool(CobbAngleTool);
  addTool(PlanarFreehandROITool);
  addTool(MagnifyTool);
  addTool(CrosshairsTool);
  addTool(SegmentationDisplayTool);
  addTool(ReferenceLinesTool);
  addTool(CalibrationLineTool);
  addTool(TrackballRotateTool);
  addTool(CircleScissorsTool);
  addTool(RectangleScissorsTool);
  addTool(SphereScissorsTool);
  addTool(ImageOverlayViewerTool);
  //addTool(FiducialTool);

  // // add any existing custom cornerstone tool
  // registerCustomCornerstoneTools([
  //   {
  //     CustomTool: FiducialTool,
  //     toolName: FiducialTool.toolName,
  //     CustomToolMappingFactory: FiducialToolMappingFactory,
  //     cursor: {
  //       icon: '<g transform="matrix(-0.0326524,0,0,0.0326498,32.325876,-0.32330448)"><path fill="{{color}}" d="m 590.1,990 c -28.2,0 -54.7,-11 -74.7,-30.9 L 40.9,484.5 c -21.8,-21.8 -33,-52 -30.6,-82.8 l 21,-273.3 c 4,-52.3 44.9,-93.2 97.2,-97.2 l 273.3,-21 C 433,7.9 462.7,19 484.6,40.8 l 474.5,474.5 c 41.2,41.2 41.2,108.2 0,149.3 L 664.8,959.1 C 644.9,979 618.4,990 590.1,990 Z M 409.9,51.8 c -1.6,0 -3.3,0.1 -4.9,0.2 L 131.7,73 C 100.1,75.4 75.4,100.1 73,131.7 L 52,405 c -1.4,18.6 5.3,36.8 18.5,50 L 545,929.5 c 24.1,24.1 66.1,24.1 90.2,0 L 929.5,635.2 c 24.9,-24.9 24.9,-65.3 0,-90.2 L 455,70.5 C 443,58.4 427,51.8 409.9,51.8 Z M 269.4,352.9 c -22.4,0 -43.4,-8.7 -59.1,-24.4 -15.7,-15.7 -24.4,-36.7 -24.4,-59.1 0,-22.4 8.7,-43.4 24.4,-59.1 15.7,-15.8 36.7,-24.4 59.1,-24.4 22.4,0 43.4,8.7 59.1,24.4 15.7,15.7 24.4,36.8 24.4,59.1 0,22.4 -8.7,43.4 -24.4,59.1 -15.7,15.7 -36.7,24.4 -59.1,24.4 z m 0,-125.3 c -11.2,0 -21.7,4.3 -29.6,12.2 -7.8,7.9 -12.2,18.4 -12.2,29.6 0,11.2 4.3,21.7 12.2,29.6 15.7,15.7 43.4,15.7 59.1,0 7.9,-7.8 12.2,-18.3 12.2,-29.6 0,-11.2 -4.3,-21.7 -12.2,-29.6 -7.8,-7.9 -18.3,-12.2 -29.5,-12.2 z"/></g>',
  //       viewBox: { x: 32, y: 32 },
  //     },
  //   },
  // ]);
  // const tools = [FiducialTool];
  // registerCustomCornerstoneTools(tools);
  const customTools = getCustomCornerstoneTools();
  Object.values(customTools).forEach(CustomTool => {
    addTool(CustomTool);
  });

  // Modify annotation tools to use dashed lines on SR
  const annotationStyle = {
    textBoxFontSize: '15px',
    lineWidth: '1.5',
  };

  const defaultStyles = annotation.config.style.getDefaultToolStyles();
  annotation.config.style.setDefaultToolStyles({
    global: {
      ...defaultStyles.global,
      ...annotationStyle,
    },
  });
}

const toolNames = {
  Pan: PanTool.toolName,
  ArrowAnnotate: ArrowAnnotateTool.toolName,
  WindowLevel: WindowLevelTool.toolName,
  StackScroll: StackScrollTool.toolName,
  StackScrollMouseWheel: StackScrollMouseWheelTool.toolName,
  Zoom: ZoomTool.toolName,
  VolumeRotateMouseWheel: VolumeRotateMouseWheelTool.toolName,
  MipJumpToClick: MIPJumpToClickTool.toolName,
  Length: LengthTool.toolName,
  DragProbe: DragProbeTool.toolName,
  Probe: ProbeTool.toolName,
  RectangleROI: RectangleROITool.toolName,
  EllipticalROI: EllipticalROITool.toolName,
  CircleROI: CircleROITool.toolName,
  Bidirectional: BidirectionalTool.toolName,
  Angle: AngleTool.toolName,
  CobbAngle: CobbAngleTool.toolName,
  PlanarFreehandROI: PlanarFreehandROITool.toolName,
  Magnify: MagnifyTool.toolName,
  Crosshairs: CrosshairsTool.toolName,
  SegmentationDisplay: SegmentationDisplayTool.toolName,
  ReferenceLines: ReferenceLinesTool.toolName,
  CalibrationLine: CalibrationLineTool.toolName,
  TrackballRotateTool: TrackballRotateTool.toolName,
  CircleScissors: CircleScissorsTool.toolName,
  RectangleScissors: RectangleScissorsTool.toolName,
  SphereScissors: SphereScissorsTool.toolName,
  ImageOverlayViewer: ImageOverlayViewerTool.toolName,
  Fiducial: FiducialTool.toolName,
};

export { toolNames };
