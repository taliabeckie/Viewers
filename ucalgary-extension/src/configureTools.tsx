import { registerIcon } from '@ohif/ui';
import iconToolFiducial from '../../platform/ui/src/assets/icons/tool-fiducial.svg';
import iconToolFreehand from '../../platform/ui/src/assets/icons/tool-freehand.svg';
import FiducialTool from './tools/FiducialTool';
import FiducialToolMappingFactory from '../../ucalgary-extension/utils/measurementServiceMappings/Fiducial';
import PlanarFreehandROIToolMappingFactory from '../../ucalgary-extension/utils/measurementServiceMappings/PlanarFreehandROI';
import { registerCustomCornerstoneTools } from '@ohif/extension-cornerstone';
import { PlanarFreehandROITool, annotation } from '@cornerstonejs/tools';
import { ConfigPoint } from '../../node_modules/config-point/dist/config-point';
import { isEmpty, forIn } from 'lodash';

/**
 * Filter styles config object to contain only valid keys as far as cs3D goes.
 * It allows only a subset of cs3d: color, lineWidth, lineDash
 * @param stylesObject
 * @returns object with valid key/value config
 */
function filterValidStylesConfiguration(stylesObject = {}) {
  const styleKeyRegExp =
    /(color|textBoxColor|lineWidth|lineDash){1}(Locked|Selected|Highlighted){0,1}(Active|Passive|Enabled){0,1}/;
  const result = {};

  forIn(stylesObject, (styleValue, styleKey) => {
    if (styleKeyRegExp.test(styleKey)) {
      result[styleKey] = styleValue;
    }
  });
  return result;
}
/**
 * Configure cs3d based on external configuration.
 * It configures the default/global level if there is an incoming config for such.
 * @param config
 */
function configureToolStyles(config = {}) {
  forIn(config, (stylesObject, styleLevel) => {
    if (styleLevel === 'global') {
      const stylesConfig = filterValidStylesConfiguration(stylesObject);

      if (!isEmpty(stylesConfig)) {
        const defaultConfig = annotation.config.style.getDefaultToolStyles() || {};
        annotation.config.style.setDefaultToolStyles({
          global: { ...defaultConfig.global, ...stylesConfig },
        });
      }
    }
  });
}
/**
 * Configure LabelDI tools: custom tools and changes to existing native tools.
 */
export default function configureTools() {
  const config = ConfigPoint.getConfig('toolStyles') || {};

  configureToolStyles(config);
  // register the svg icon in the list of app svgs.
  registerIcon('tool-fiducial', iconToolFiducial);
  registerIcon('tool-freehand', iconToolFreehand);
  // register in native cs3d extension the custom tool class, mapping factory and the tool cursor.
  registerCustomCornerstoneTools([
    {
      CustomTool: FiducialTool,
      toolName: FiducialTool.toolName,
      CustomToolMappingFactory: FiducialToolMappingFactory,
      cursor: {
        icon: '<g transform="matrix(-0.0326524,0,0,0.0326498,32.325876,-0.32330448)"><path fill="{{color}}" d="m 590.1,990 c -28.2,0 -54.7,-11 -74.7,-30.9 L 40.9,484.5 c -21.8,-21.8 -33,-52 -30.6,-82.8 l 21,-273.3 c 4,-52.3 44.9,-93.2 97.2,-97.2 l 273.3,-21 C 433,7.9 462.7,19 484.6,40.8 l 474.5,474.5 c 41.2,41.2 41.2,108.2 0,149.3 L 664.8,959.1 C 644.9,979 618.4,990 590.1,990 Z M 409.9,51.8 c -1.6,0 -3.3,0.1 -4.9,0.2 L 131.7,73 C 100.1,75.4 75.4,100.1 73,131.7 L 52,405 c -1.4,18.6 5.3,36.8 18.5,50 L 545,929.5 c 24.1,24.1 66.1,24.1 90.2,0 L 929.5,635.2 c 24.9,-24.9 24.9,-65.3 0,-90.2 L 455,70.5 C 443,58.4 427,51.8 409.9,51.8 Z M 269.4,352.9 c -22.4,0 -43.4,-8.7 -59.1,-24.4 -15.7,-15.7 -24.4,-36.7 -24.4,-59.1 0,-22.4 8.7,-43.4 24.4,-59.1 15.7,-15.8 36.7,-24.4 59.1,-24.4 22.4,0 43.4,8.7 59.1,24.4 15.7,15.7 24.4,36.8 24.4,59.1 0,22.4 -8.7,43.4 -24.4,59.1 -15.7,15.7 -36.7,24.4 -59.1,24.4 z m 0,-125.3 c -11.2,0 -21.7,4.3 -29.6,12.2 -7.8,7.9 -12.2,18.4 -12.2,29.6 0,11.2 4.3,21.7 12.2,29.6 15.7,15.7 43.4,15.7 59.1,0 7.9,-7.8 12.2,-18.3 12.2,-29.6 0,-11.2 -4.3,-21.7 -12.2,-29.6 -7.8,-7.9 -18.3,-12.2 -29.5,-12.2 z"/></g>',
        viewBox: { x: 32, y: 32 },
      },
    },
    {
      CustomTool: PlanarFreehandROITool,
      toolName: PlanarFreehandROITool.toolName,
      CustomToolMappingFactory: PlanarFreehandROIToolMappingFactory,
      cursor: {
        icon: '<g><path fill="{{color}}" d="M 18.310547 0.001953125 L 1.4394531 16.873047 L 0 24 L 7.1289062 22.5625 L 24.001953 5.6914062 L 18.310547 0.001953125 z M 18.310547 2.828125 L 21.171875 5.6894531 L 7.5546875 19.306641 L 4.6953125 16.445312 L 15.519531 5.6191406 L 18.365234 8.4667969 L 19.779297 7.0527344 L 16.933594 4.2050781 L 18.310547 2.828125 z M 18.355469 16.423828 L 18.355469 19.169922 L 15.507812 19.169922 L 15.507812 20.898438 L 18.355469 20.898438 L 18.355469 23.847656 L 20.083984 23.847656 L 20.083984 20.898438 L 22.931641 20.898438 L 22.931641 19.169922 L 20.083984 19.169922 L 20.083984 16.423828 L 18.355469 16.423828 z M 3.2792969 17.861328 L 6.140625 20.720703 L 2.5585938 21.445312 L 3.2792969 17.861328 z "/></g>',
        viewBox: { x: 32, y: 32 },
      },
    },
  ]);
}
