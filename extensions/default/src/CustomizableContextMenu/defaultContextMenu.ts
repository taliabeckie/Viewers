const defaultContextMenu = {
  id: 'measurementsContextMenu',
  customizationType: 'ohif.contextMenu',
  menus: [
    // Get the items from the UI Customization for the menu name (and have a custom name)
    {
      id: 'forExistingMeasurement',
      selector: ({ nearbyToolData }) => !!nearbyToolData,
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
              commandName: 'labelLVendo',
            },
          ],
        },

        {
          label: 'LV epi',
          commands: [
            {
              commandName: 'labelLVepi',
            },
          ],
        },

        {
          label: 'RV endo', //ADD COLOR
          commands: [
            {
              commandName: 'labelRVendo',
            },
          ],
        },

        {
          label: 'RV epi',
          commands: [
            {
              commandName: 'labelRVepi',
            },
          ],
        },

        {
          label: 'LA endo',
          commands: [
            {
              commandName: 'labelLAendo',
            },
          ],
        },

        {
          label: 'RA endo',
          commands: [
            {
              commandName: 'labelRAendo',
            },
          ],
        },

        // {
        //   label: 'Aorta desc',
        //   commands: [
        //     {
        //       commandName: 'labelLAortadesc', //not recognized in current context
        //     },
        //   ],
        // },

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
          commands: [
            {
              commandName: 'setMeasurementLabel', //find a way to send viewportUID? //rn is tied to Fiducial. After getting Fiducial to work I can create functions in commandsModule related to these
            },
          ],
        },
        {
          label: '4-Chamber',
          commands: [
            {
              commandName: 'setMeasurementLabel',
            },
          ],
        },
        {
          label: '3-Chamber',
          commands: [
            {
              commandName: 'setMeasurementLabel',
            },
          ],
        },
        {
          label: '2-Chamber',
          commands: [
            {
              commandName: 'setMeasurementLabel',
            },
          ],
        },
        // 'SegmentationCardiac:4ch': {
        //   text: '4-chamber',
        //   color: '#000000',
        //   seriesLabel: true,
        // },
        // 'SegmentationCardiac:3ch': {
        //   text: '3-chamber',
        //   color: '#000000',
        //   seriesLabel: true,
        // },
        // 'SCT:399232001': {
        //   text: '2-chamber',
        //   color: '#000000',
        //   seriesLabel: true,
        // },
        // 'SCT:103340004': {
        //   text: 'SAX',
        //   color: '#000000',
        //   seriesLabel: true,
        // },
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

// // fiducial
// 'SegmentationCardiac:20000101': {
//   text: 'RVI site - AHA',
//   color: '#191970',
// },
// 'SegmentationCardiac:20000102': {
//   text: 'RVI site - other',
//   color: '#0000FF',
// },
// 'SegmentationCardiac:20000201': {
//   text: 'AV mid',
//   color: '#4169E1',
// },
// 'SegmentationCardiac:20000202': {
//   text: 'AV RCC',
//   color: '#7B68EE',
// },
// 'SegmentationCardiac:20000203': {
//   text: 'AV LCC',
//   color: '#6495ED',
// },
// 'SegmentationCardiac:20000204': {
//   text: 'AV NCC',
//   color: '#1E90FF',
// },
// 'SegmentationCardiac:20000301': {
//   text: 'MV mid',
//   color: '#00BFFF',
// },
// 'SegmentationCardiac:20000401': {
//   text: 'PV mid',
//   color: '#87CEEB',
// },
// 'SegmentationCardiac:20000501': {
//   text: 'TV mid',
//   color: '#87CEFA',
// },
// 'SegmentationCardiac:20000601': {
//   text: 'LM ostium',
//   color: '#B0E0E6',
// },
// 'SegmentationCardiac:20000602': {
//   text: 'RCA ostium',
//   color: '#F0F8FF',
// },
// 'SegmentationCardiac:20000603': {
//   text: 'LCx ostium',
//   color: '#B0C4DE',
// },
// 'SegmentationCardiac:20000701': {
//   text: 'Other',
//   color: '#8A2BE2',
// },
