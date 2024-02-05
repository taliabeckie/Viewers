const findingsContextMenu = {
  id: 'measurementsContextMenu',
  customizationType: 'ohif.contextMenu',
  menus: [
    {
      id: 'forExistingMeasurement',
      // selector restricts context menu to when there is nearbyToolData
      selector: ({ nearbyToolData }) => !!nearbyToolData,
      items: [
        {
          customizationType: 'ohif.contextSubMenu',
          label: 'Site',
          actionType: 'ShowSubMenu',
          subMenu: 'siteSelectionSubMenu',
        },
        {
          customizationType: 'ohif.contextSubMenu',
          label: 'Finding',
          actionType: 'ShowSubMenu',
          subMenu: 'findingSelectionSubMenu',
        },
        {
          // customizationType is implicit here in the configuration setup
          label: 'Delete Measurement',
          commands: [
            {
              commandName: 'deleteMeasurement',
            },
          ],
        },
        {
          label: 'Custom Label',
          commands: [
            {
              commandName: 'setMeasurementLabel',
            },
          ],
        },

        // The example below shows how to include a delegating sub-menu,
        // Only available on the @ohif/mnGrid hanging protocol
        // To demonstrate, select the 3x1 layout from the protocol menu
        // and right click on a measurement.
        {
          label: 'IncludeSubMenu',
          selector: ({ protocol }) => protocol?.id === '@ohif/mnGrid',
          delegating: true,
          subMenu: 'orientationSelectionSubMenu',
        },
      ],
    },

    {
      id: 'seriesLabellingSelectionMenu',
      selector: ({ nearbyToolData }) => !nearbyToolData,
      items: [
        {
          actionType: 'SetSeriesLabel',
          findingSite: 'SegmentationCardiac:4ch',
        },
        {
          actionType: 'SetSeriesLabel',
          findingSite: 'SegmentationCardiac:3ch',
        },
        {
          actionType: 'SetSeriesLabel',
          findingSite: 'SCT:399232001',
        },
        {
          actionType: 'SetSeriesLabel',
          findingSite: 'SCT:103340004',
        },
        {
          actionType: 'SetSeriesLabel',
          findingSite: 'SegmentationCardiac:av',
        },
        {
          actionType: 'SetSeriesLabel',
          findingSite: 'SCT:91134007',
        },
        {
          actionType: 'SetSeriesLabel',
          findingSite: 'SCT:122972007',
        },
        {
          actionType: 'SetSeriesLabel',
          findingSite: 'SegmentationCardiac:ao_cc',
        },
        {
          actionType: 'SetSeriesLabel',
          findingSite: 'SCT:24422004',
        },
        {
          actionType: 'SetSeriesLabel',
          findingSite: 'SCT:81654009',
        },
        {
          actionType: 'SetSeriesLabel',
          findingSite: 'SCT:30730003',
        },
        {
          actionType: 'SetSeriesLabel',
          findingSite: 'SegmentationCardiac:other',
        },
      ],
    },

    {
      id: 'fiducialSiteSelectionMenu',
      selector: ({ nearbyToolData }, menuId) => menuId === 'fiducialSiteSelectionMenu',
      items: [
        {
          label: 'Delete measurement',
          actionType: 'Delete',
        },
        {
          actionType: 'SiteSelection',
          findingSite: 'SegmentationCardiac:20000101',
        },
        {
          actionType: 'SiteSelection',
          findingSite: 'SegmentationCardiac:20000102',
        },
        {
          actionType: 'SiteSelection',
          findingSite: 'SegmentationCardiac:20000201',
        },
        {
          actionType: 'SiteSelection',
          findingSite: 'SegmentationCardiac:20000202',
        },
        {
          actionType: 'SiteSelection',
          findingSite: 'SegmentationCardiac:20000203',
        },
        {
          actionType: 'SiteSelection',
          findingSite: 'SegmentationCardiac:20000204',
        },
        {
          actionType: 'SiteSelection',
          findingSite: 'SegmentationCardiac:20000301',
        },
        {
          actionType: 'SiteSelection',
          findingSite: 'SegmentationCardiac:20000401',
        },
        {
          actionType: 'SiteSelection',
          findingSite: 'SegmentationCardiac:20000501',
        },
        {
          actionType: 'SiteSelection',
          findingSite: 'SegmentationCardiac:20000601',
        },
        {
          actionType: 'SiteSelection',
          findingSite: 'SegmentationCardiac:20000602',
        },
        {
          actionType: 'SiteSelection',
          findingSite: 'SegmentationCardiac:20000603',
        },
        {
          actionType: 'SiteSelection',
          findingSite: 'SegmentationCardiac:20000701',
        },
      ],
    },

    {
      id: 'orientationSelectionSubMenu',
      selector: ({ nearbyToolData }) => false,
      items: [
        {
          customizationType: '@ohif/contextMenuAnnotationCode',
          code: 'SCT:24422004',
        },
        {
          customizationType: '@ohif/contextMenuAnnotationCode',
          code: 'SCT:81654009',
        },
      ],
    },

    {
      id: 'findingSelectionSubMenu',
      selector: ({ nearbyToolData }) => false,
      items: [
        {
          customizationType: '@ohif/contextMenuAnnotationCode',
          code: 'SCT:371861004',
        },
        {
          customizationType: '@ohif/contextMenuAnnotationCode',
          code: 'SCT:194983005',
        },
      ],
    },

    {
      id: 'siteSelectionSubMenu',
      selector: ({ nearbyToolData }) => !!nearbyToolData,
      items: [
        {
          customizationType: '@ohif/contextMenuAnnotationCode',
          code: 'SCT:69536005',
        },
        {
          customizationType: '@ohif/contextMenuAnnotationCode',
          code: 'SCT:45048000',
        },
      ],
    },
  ],
};

export default findingsContextMenu;
