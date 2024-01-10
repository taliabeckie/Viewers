window.config = {
  routerBasename: '/',
  // whiteLabelling: {},
  extensions: [],
  modes: [],
  defaultTheme: 'labeldi',
  showStudyList: true,
  // filterQueryParam: false,
  imageLoaderAcceptHeader: 'multipart/related; type="application/octet-stream"',
  dataSources: [
    {
      friendlyName: 'dcmjs DICOMWeb Server',
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'dicomweb',
      configuration: {
        name: 'DCM4CHEE',
        wadoUriRoot: 'http://localhost/dicom-web', //'https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/wado',
        qidoRoot: 'http://localhost/dicom-web', //'https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/rs',
        wadoRoot: 'http://localhost/dicom-web', //'https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/rs',
        qidoSupportsIncludeField: true,
        supportsReject: true,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        enableStudyLazyLoad: true,
        supportsFuzzyMatching: true,
        supportsWildcard: true,
      },
    },
    {
      friendlyName: 'dicomweb delegating proxy',
      namespace: '@radical/dicomweb-proxy-extension.dataSourcesModule.dicomwebproxy',
      sourceName: 'dicomwebproxy',
      configuration: {
        name: 'dicomwebproxy',
      },
    },
    {
      friendlyName: 'dicom json',
      namespace: '@ohif/extension-default.dataSourcesModule.dicomjson',
      sourceName: 'dicomjson',
      configuration: {
        name: 'json',
      },
    },
    {
      friendlyName: 'dicom local',
      namespace: '@ohif/extension-default.dataSourcesModule.dicomlocal',
      sourceName: 'dicomlocal',
      configuration: {},
    },
  ],
  httpErrorHandler: error => {
    // This is 429 when rejected from the public idc sandbox too often.
    console.warn(error.status);

    // Could use services manager here to bring up a dialog/modal if needed.
    console.warn('test, navigate to https://ohif.org/');
  },
  defaultDataSourceName: 'dicomwebproxy',
  hotkeys: [
    {
      commandName: 'showViewerContextMenu',
      label: 'Show Viewer Context Menu',
      keys: ['ctrl+d'],
      commandOptions: {
        menuId: 'forExistingMeasurement',
        useSelectedAnnotation: true,
      },
    },
    {
      commandName: 'showViewerContextMenu',
      label: 'Show Site Selection Context Menu',
      keys: ['ctrl+l'],
      commandOptions: {
        menuId: 'siteSelectionMenu',
        useSelectedAnnotation: true,
      },
    },
    {
      commandName: 'showViewerContextMenu',
      label: 'Show Series Labelling Context Menu',
      keys: ['ctrl+s'],
      commandOptions: {
        menuId: 'seriesLabellingSelectionMenu',
        useSelectedOrNoneAnnotation: true,
        allowedSelectedTools: ['Fiducial'],
      },
    },
    {
      commandName: 'incrementActiveViewport',
      label: 'Next Viewport',
      keys: ['pageup'],
    },
    {
      commandName: 'decrementActiveViewport',
      label: 'Previous Viewport',
      keys: ['pagedown'],
    },
    { commandName: 'rotateViewportCW', label: 'Rotate Right', keys: ['r'] },
    { commandName: 'rotateViewportCCW', label: 'Rotate Left', keys: ['l'] },
    { commandName: 'invertViewport', label: 'Invert', keys: ['i'] },
    {
      commandName: 'flipViewportVertical',
      label: 'Flip Horizontally',
      keys: ['h'],
    },
    {
      commandName: 'flipViewportHorizontal',
      label: 'Flip Vertically',
      keys: ['v'],
    },
    {
      commandName: 'toggleMeasurementsVisibility',
      commandOptions: { ids: [] }, // get current active measurement
      label: 'Toggle measurement visibility',
      keys: ['m'],
    },
    {
      commandName: 'toggleMeasurementsVisibility',
      commandOptions: { ids: undefined }, // bulk op
      label: 'Toggle all measurements visibility',
      keys: ['shift+m'],
    },
    {
      commandName: 'interpolateSelectedPlanarFreehandAnnotation',
      label: 'Interpolate the selected Freehand annotation',
      keys: ['s'],
      commandOptions: {
        knotsRatioPercentage: 10,
      },
    },
    { commandName: 'scaleUpViewport', label: 'Zoom In', keys: ['+'] },
    { commandName: 'scaleDownViewport', label: 'Zoom Out', keys: ['-'] },
    { commandName: 'fitViewportToWindow', label: 'Zoom to Fit', keys: ['='] },
    { commandName: 'resetViewport', label: 'Reset', keys: ['space'] },
    {
      commandName: 'nextImage',
      label: 'Next Image',
      keys: ['right'],
      commandOptions: { wrap: true },
    },
    {
      commandName: 'previousImage',
      label: 'Previous Image',
      keys: ['left'],
      commandOptions: { wrap: true },
    },
    {
      commandName: 'previousViewportDisplaySet',
      label: 'Previous Series',
      keys: ['up'],
    },
    {
      commandName: 'nextViewportDisplaySet',
      label: 'Next Series',
      keys: ['down'],
    },
    { commandName: 'setZoomTool', label: 'Zoom', keys: ['z'] },
    // ~ Window level presets
    {
      commandName: 'windowLevelPreset1',
      label: 'W/L Preset 1',
      keys: ['1'],
    },
    {
      commandName: 'windowLevelPreset2',
      label: 'W/L Preset 2',
      keys: ['2'],
    },
    {
      commandName: 'windowLevelPreset3',
      label: 'W/L Preset 3',
      keys: ['3'],
    },
    {
      commandName: 'windowLevelPreset4',
      label: 'W/L Preset 4',
      keys: ['4'],
    },
    {
      commandName: 'windowLevelPreset5',
      label: 'W/L Preset 5',
      keys: ['5'],
    },
    {
      commandName: 'windowLevelPreset6',
      label: 'W/L Preset 6',
      keys: ['6'],
    },
    {
      commandName: 'windowLevelPreset7',
      label: 'W/L Preset 7',
      keys: ['7'],
    },
    {
      commandName: 'windowLevelPreset8',
      label: 'W/L Preset 8',
      keys: ['8'],
    },
    {
      commandName: 'windowLevelPreset9',
      label: 'W/L Preset 9',
      keys: ['9'],
    },
  ],
};
