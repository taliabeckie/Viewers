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
          label: 'RV endo',
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
        //       commandName: 'labelLAortadesc',
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
      id: 'foremptyviewport',
      items: [
        {
          label: 'SAX',
          commands: [
            {
              commandName: 'setMeasurementLabel',
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
      ],
    },
  ],
};

export default defaultContextMenu;
