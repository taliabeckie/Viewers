import React from 'react';
import * as cornerstone from '@cornerstonejs/core';
import * as cornerstoneTools from '@cornerstonejs/tools';
import {
  Enums as cs3DEnums,
  imageLoadPoolManager,
  imageRetrievalPoolManager,
} from '@cornerstonejs/core';
import { Enums as cs3DToolsEnums } from '@cornerstonejs/tools';
import { ServicesManager, Types } from '@ohif/core';

import init from './init';
import getCustomizationModule from './getCustomizationModule';
import getCommandsModule from './commandsModule';
import getHangingProtocolModule from './getHangingProtocolModule';
import ToolGroupService from './services/ToolGroupService';
import SyncGroupService from './services/SyncGroupService';
import SegmentationService from './services/SegmentationService';
import CornerstoneCacheService from './services/CornerstoneCacheService';
import CornerstoneViewportService from './services/ViewportService/CornerstoneViewportService';
import * as CornerstoneExtensionTypes from './types';

import { toolNames } from './initCornerstoneTools';
import { getEnabledElement, reset as enabledElementReset } from './state';
import dicomLoaderService from './utils/dicomLoaderService';
import getActiveViewportEnabledElement from './utils/getActiveViewportEnabledElement';

import { id } from './id';
import * as csWADOImageLoader from './initWADOImageLoader.js';
import { measurementMappingUtils } from './utils/measurementServiceMappings';
import type { PublicViewportOptions } from './services/ViewportService/Viewport';
import ImageOverlayViewerTool from './tools/ImageOverlayViewerTool';

import getSOPInstanceAttributes from './utils/measurementServiceMappings/utils/getSOPInstanceAttributes.js';
import {
  getAnnotationColor,
  setAnnotationColor,
  setAnnotationLineDash,
} from './utils/measurementServiceMappings/utils/style.js';
import {
  isAnnotationSelected,
  setAnnotationSelected,
} from './utils/measurementServiceMappings/utils/selection.js';
import { setAnnotationVisibility } from './utils/measurementServiceMappings/utils/visibility.js';
import registerCustomCornerstoneTools from './registerCustomCornerstoneTools.js';
import CornerstoneCache from './services/ViewportService/CornerstoneCacheService';
import configureTools from '../../../ucalgary-extension/src/configureTools';
import ExternalAlgorithmService from '../../../ucalgary-extension/src/services/ExternalAlgorithmService';
//'./services/ExternalAlgorithmService';

const Component = React.lazy(() => {
  return import(/* webpackPrefetch: true */ './Viewport/OHIFCornerstoneViewport');
});

const OHIFCornerstoneViewport = props => {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <Component {...props} />
    </React.Suspense>
  );
};

const registerCacheService = {
  name: 'cornerstoneCacheService',
  create: () => {
    return CornerstoneCache;
  },
};

/**
 *
 */
const cornerstoneExtension: Types.Extensions.Extension = {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id,

  onModeExit: (): void => {
    // Empty out the image load and retrieval pools to prevent memory leaks
    // on the mode exits
    Object.values(cs3DEnums.RequestType).forEach(type => {
      imageLoadPoolManager.clearRequestStack(type);
      imageRetrievalPoolManager.clearRequestStack(type);
    });

    enabledElementReset();
  },

  /**
   * Register the Cornerstone 3D services and set them up for use.
   *
   * @param configuration.csToolsConfig - Passed directly to `initCornerstoneTools`
   */
  preRegistration: function (props: Types.Extensions.ExtensionParams): Promise<void> {
    const { servicesManager } = props;
    servicesManager.registerService(CornerstoneViewportService.REGISTRATION);
    servicesManager.registerService(ToolGroupService.REGISTRATION);
    servicesManager.registerService(SyncGroupService.REGISTRATION);
    servicesManager.registerService(SegmentationService.REGISTRATION);
    servicesManager.registerService(CornerstoneCacheService.REGISTRATION);
    servicesManager.registerService(ExternalAlgorithmService);
    configureTools();
    return init.call(this, props);
  },

  getHangingProtocolModule,
  getViewportModule({ servicesManager, commandsManager }) {
    const ExtendedOHIFCornerstoneViewport = props => {
      // const onNewImageHandler = jumpData => {
      //   commandsManager.runCommand('jumpToImage', jumpData);
      // };
      const { toolbarService } = (servicesManager as ServicesManager).services;

      return (
        <OHIFCornerstoneViewport
          {...props}
          toolbarService={toolbarService}
          servicesManager={servicesManager}
          commandsManager={commandsManager}
        />
      );
    };

    return [
      {
        name: 'cornerstone',
        component: ExtendedOHIFCornerstoneViewport,
      },
    ];
  },
  getCommandsModule,
  getCustomizationModule,
  getUtilityModule({ servicesManager }) {
    return [
      {
        name: 'common',
        exports: {
          getCornerstoneLibraries: () => {
            return { cornerstone, cornerstoneTools };
          },
          getEnabledElement,
          dicomLoaderService,
          //registerColorMap present in V2
        },
      },
      {
        name: 'core',
        exports: {
          Enums: cs3DEnums,
        },
      },
      {
        name: 'tools',
        exports: {
          toolNames,
          Enums: cs3DToolsEnums,
        },
      },
    ];
  },
};
// TODO update upstream. It seems there is a new way of exporting modules.
const extensionUtils = {
  getSOPInstanceAttributes,
  getEnabledElement,
  annotation: {
    setAnnotationColor,
    setAnnotationLineDash,
    getAnnotationColor,
    setAnnotationSelected,
    setAnnotationVisibility,
    isAnnotationSelected,
  },
};

export type { PublicViewportOptions };
export {
  measurementMappingUtils,
  CornerstoneExtensionTypes as Types,
  toolNames,
  getActiveViewportEnabledElement,
  ImageOverlayViewerTool,
};
export { registerCustomCornerstoneTools, extensionUtils };
export default cornerstoneExtension;
