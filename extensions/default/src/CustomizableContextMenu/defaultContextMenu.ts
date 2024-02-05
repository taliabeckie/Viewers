const defaultContextMenu = {
  id: 'measurementsContextMenu',
  customizationType: 'ohif.contextMenu',
  menus: [
    // Get the items from the UI Customization for the menu name (and have a custom name)
    {
      id: 'forExistingMeasurement',
      selector: ({ toolName, nearbyToolData }) =>
        toolName === 'PlanarFreehandROI' && !!nearbyToolData,
      items: [
        {
          label: 'Delete measurement',
          commands: [
            {
              commandName: 'deleteMeasurement',
            },
          ],
        },
        {
          label: 'LV endo',
          commands: [
            {
              commandName: 'labelMeasurement',
              label: 'LV endo',
            },
          ],
        },
        {
          label: 'LV epi',
          commands: [
            {
              commandName: 'labelMeasurement',
              label: 'LV epi',
            },
          ],
        },
        {
          label: 'RV endo',
          commands: [
            {
              commandName: 'labelMeasurement',
              label: 'RV endo',
            },
          ],
        },
        {
          label: 'RV epi',
          commands: [
            {
              commandName: 'labelMeasurement',
              label: 'RV epi',
            },
          ],
        },
        {
          label: 'LA endo',
          commands: [
            {
              commandName: 'labelMeasurement',
              label: 'LA endo',
            },
          ],
        },
        {
          label: 'RA endo',
          commands: [
            {
              commandName: 'labelMeasurement',
              label: 'RA endo',
            },
          ],
        },
        {
          label: 'Aorta desc',
          commands: [
            {
              commandName: 'labelMeasurement',
              label: 'Aorta desc',
            },
          ],
        },
        {
          label: 'Custom label',
          commands: [
            {
              commandName: 'setMeasurementLabel',
            },
          ],
        },
      ],
    },

    {
      id: 'fiducialLabellingSelectionMenu',
      selector: ({ toolName, nearbyToolData }) => toolName === 'Fiducial' && !!nearbyToolData,
      items: [
        {
          label: 'Delete measurement',
          commands: [
            {
              commandName: 'deleteMeasurement',
            },
          ],
        },
        {
          label: 'RVI AHA',
          commands: [
            {
              commandName: 'labelMeasurement',
              label: 'RVI site - AHA',
            },
          ],
        },
        {
          label: 'RVI other',
          commands: [
            {
              commandName: 'labelMeasurement',
              label: 'RVI site - other',
            },
          ],
        },
        {
          label: 'AV mid',
          commands: [
            {
              commandName: 'labelMeasurement',
              label: 'AV mid',
            },
          ],
        },
        {
          label: 'AV RCC',
          commands: [
            {
              commandName: 'labelMeasurement',
              label: 'AV RCC',
            },
          ],
        },
        {
          label: 'AV LCC',
          commands: [
            {
              commandName: 'labelMeasurement',
              label: 'AV LCC',
            },
          ],
        },
        {
          label: 'AV NCC',
          commands: [
            {
              commandName: 'labelMeasurement',
              label: 'AV NCC',
            },
          ],
        },
        {
          label: 'MV mid',
          commands: [
            {
              commandName: 'labelMeasurement',
              label: 'MV mid',
            },
          ],
        },
        {
          label: 'PV mid',
          commands: [
            {
              commandName: 'labelMeasurement',
              label: 'PV mid',
            },
          ],
        },
        {
          label: 'TV mid',
          commands: [
            {
              commandName: 'labelMeasurement',
              label: 'TV mid',
            },
          ],
        },
        {
          label: 'LM ostium',
          commands: [
            {
              commandName: 'labelMeasurement',
              label: 'LM ostium',
            },
          ],
        },
        {
          label: 'RCA ostium',
          commands: [
            {
              commandName: 'labelMeasurement',
              label: 'RCA ostium',
            },
          ],
        },
        {
          label: 'LCx ostium',
          commands: [
            {
              commandName: 'labelMeasurement',
              label: 'LCx ostium',
            },
          ],
        },
        {
          label: 'Custom label',
          commands: [
            {
              commandName: 'setMeasurementLabel',
            },
          ],
        },
      ],
    },

    {
      id: 'seriesLabellingSelectionMenu',
      selector: ({ nearbyToolData }) => !nearbyToolData,
      items: [
        {
          label: 'SAX',
          commands: [],
        },
        {
          label: '4-Chamber',
          commands: [
            {
              commandName: '',
            },
          ],
        },
        {
          label: '3-Chamber',
          commands: [
            {
              commandName: '',
            },
          ],
        },
        {
          label: '2-Chamber',
          commands: [
            {
              commandName: '',
            },
          ],
        },

        // 'SegmentationCardiac:av': {
        //   text: 'AV',
        //   color: '#000000',
        //   seriesLabel: true,
        // },
        // 'SCT:91134007': {
        //   text: 'MV',
        //   color: '#000000',
        //   seriesLabel: true,
        // },
        // 'SCT:122972007': {
        //   text: 'PV',
        //   color: '#000000',
        //   seriesLabel: true,
        // },
        // 'SegmentationCardiac:ao_cc': {
        //   text: 'Aorta - candycane',
        //   color: '#000000',
        //   seriesLabel: true,
        // },
        // 'SCT:24422004': {
        //   text: 'Axial',
        //   color: '#000000',
        //   seriesLabel: true,
        // },
        // 'SCT:81654009': {
        //   text: 'Coronal',
        //   color: '#000000',
        //   seriesLabel: true,
        // },
        // 'SCT:30730003': {
        //   text: 'Sagittal',
        //   color: '#000000',
        //   seriesLabel: true,
        // },
        // 'SegmentationCardiac:other': {
        //   text: 'Other',
        //   color: '#000000',
        //   seriesLabel: true,
        // },
      ],
    },
  ],
};

export default defaultContextMenu;
