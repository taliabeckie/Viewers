import { hotkeys } from '@ohif/core';
import { id } from './id';
import toolbarButtons from './toolbarButtons';
import initToolGroups from './initToolGroups';

//const hotkeys =
// ((window || {}).config || {})['hotkeys'] ||
// coreHotkeys.defaults.hotkeyBindings;

const configs = {
  Length: {},
  PlanarFreehandROI: {
    alwaysRenderOpenContourHandles: {
      enabled: true,
      radius: 2,
    },
    interpolation: {
      interpolateOnAdd: false,
      interpolateOnEdit: false,
    },
  },
};

const cornerstone = {
  viewport: '@ohif/extension-cornerstone.viewportModule.cornerstone',
};

const ohif = {
  layout: '@ohif/extension-default.layoutTemplateModule.viewerLayout',
  sopClassHandler: '@ohif/extension-default.sopClassHandlerModule.stack',
  hangingProtocol: '@ohif/extension-default.hangingProtocolModule.default',
  leftPanel: '@ohif/extension-default.panelModule.seriesList',
  rightPanel: '@ohif/extension-default.panelModule.measure',
};

const labeldi = {
  measurements: '@labeldi/extension-default.panelModule.measure',
};

const tracked = {
  measurements: '@ohif/extension-measurement-tracking.panelModule.trackedMeasurements',
  thumbnailList: '@ohif/extension-measurement-tracking.panelModule.seriesList',
  viewport: '@ohif/extension-measurement-tracking.viewportModule.cornerstone-tracked',
};

const dicomsr = {
  sopClassHandler: '@ohif/extension-cornerstone-dicom-sr.sopClassHandlerModule.dicom-sr',
  viewport: '@ohif/extension-cornerstone-dicom-sr.viewportModule.dicom-sr',
};

const dicomvideo = {
  sopClassHandler: '@ohif/extension-dicom-video.sopClassHandlerModule.dicom-video',
  viewport: '@ohif/extension-dicom-video.viewportModule.dicom-video',
};

const dicompdf = {
  sopClassHandler: '@ohif/extension-dicom-pdf.sopClassHandlerModule.dicom-pdf',
  viewport: '@ohif/extension-dicom-pdf.viewportModule.dicom-pdf',
};

const extensionDependencies = {
  '@ohif/extension-default': '^3.0.0',
  '@ohif/extension-cornerstone': '^3.0.0',
  '@ohif/extension-measurement-tracking': '^3.0.0',
  '@ohif/extension-cornerstone-dicom-sr': '^3.0.0',
  '@ohif/extension-dicom-pdf': '^3.0.1',
  '@ohif/extension-dicom-video': '^3.0.1',
  // '@labeldi/extension-default': '^3.0.0',
  //'@radicalimaging/hp-extension': '^3.3.0',
};

function modeFactory({ modeConfiguration }) {
  return {
    /**
     * Mode ID, which should be unique among modes used by the viewer. This ID
     * is used to identify the mode in the viewer's state.
     */
    id,
    // routeName: 'viewer',

    /**
     * Mode name, which is displayed in the viewer's UI in the workList, for the
     * user to select the mode.
     */
    displayName: 'UCalgary',

    /**
     * Runs when the Mode Route is mounted to the DOM. Usually used to initialize
     * services and other resources or data. Is called whenever a new mode is entered.
     */
    onModeEnter: ({ servicesManager, extensionManager, commandsManager }) => {
      const { measurementService, toolbarService, toolGroupService } = servicesManager.services;

      measurementService.clearMeasurements();

      // Init Default and SR ToolGroups
      initToolGroups(extensionManager, toolGroupService, commandsManager);

      let unsubscribe;

      const activateTool = () => {
        toolbarService.recordInteraction({
          groupId: 'WindowLevel',
          interactionType: 'tool',
          commands: [
            {
              commandName: 'setToolActive',
              commandOptions: {
                toolName: 'WindowLevel',
              },
              context: 'CORNERSTONE',
            },
          ],
        });

        // We don't need to reset the active tool whenever a viewport is getting
        // added to the toolGroup.
        unsubscribe();
      };

      // Since we only have one viewport for the basic cs3d mode and it has
      // only one hanging protocol, we can just use the first viewport
      ({ unsubscribe } = toolGroupService.subscribe(
        toolGroupService.EVENTS.VIEWPORT_ADDED,
        activateTool
      ));

      toolbarService.init(extensionManager);
      toolbarService.addButtons(toolbarButtons);
      toolbarService.createButtonSection('primary', [
        'Freehand',
        'Fiducial',
        'MeasurementTools',
        'Zoom',
        'WindowLevel',
        'Pan',
        'Layout',
        'MoreTools',
        //    'Cine',
      ]);
    },
    /**
     * OnModeExit is called when navigating away from a mode.
     * Can be used to cache data for reuse later.
     */
    onModeExit: ({ servicesManager }) => {
      const {
        toolGroupService,
        syncGroupService,
        toolbarService,
        segmentationService,
        cornerstoneViewportService,
        ExternalAlgorithmService,
      } = servicesManager.services;

      toolGroupService.destroy();
      syncGroupService.destroy();
      segmentationService.destroy();
      cornerstoneViewportService.destroy();
      ExternalAlgorithmService.clearResults();
    },
    /** */
    validationTags: {
      study: [],
      series: [],
    },
    /**
     * A boolean return value that indicates whether the mode is valid for the
     * modalities of the selected studies. For instance a PET/CT mode should be
     */
    isValidMode: ({ modalities }) => true,
    /**
     * Mode Routes are used to define the mode's behavior. A list of Mode Route
     * that includes the mode's path and the layout to be used. The layout will
     * include the components that are used in the layout. For instance, if the
     * default layoutTemplate is used (id: '@ohif/extension-default.layoutTemplateModule.viewerLayout')
     * it will include the leftPanels, rightPanels, and viewports. However, if
     * you define another layoutTemplate that includes a Footer for instance,
     * you should provide the Footer component here too. Note: We use Strings
     * to reference the component's ID as they are registered in the internal
     * ExtensionManager. The template for the string is:
     * `${extensionId}.{moduleType}.${componentId}`.
     */
    routes: [
      {
        path: 'longitudinal', //defines the route path to access the built applications for that route. Previously worked with 'template'
        layoutTemplate: ({ location, servicesManager }) => {
          //defines the layout for the specified route
          return {
            id: ohif.layout,
            props: {
              leftPanels: [ohif.leftPanel],
              rightPanels: [ohif.rightPanel],
              //  rightPanels: [labeldi.measurements],
              viewports: [
                {
                  namespace: cornerstone.viewport,
                  displaySetsToDisplay: [ohif.sopClassHandler],
                },
              ],
            },
          };
        },
      },
    ],
    /** List of extensions that are used by the mode */
    extensions: extensionDependencies,
    /** HangingProtocol used by the mode
     * Specify an array of hanging protocols so the mode
     * can rank them based on the displaySetSelector requirements.
     */
    // hangingProtocol: [''],
    /** SopClassHandlers used by the mode.
     * Used to initialize 'DisplaySetService' with the provided SOPClass modules.
     * Handles the creation of the displaySets.
     */
    sopClassHandlers: [ohif.sopClassHandler],
    /** hotkeys for mode */
    hotkeys: [...hotkeys.defaults.hotkeyBindings],
  };
}

const mode = {
  id,
  modeFactory,
  extensionDependencies,
};

export default mode;
