import React from 'react';
import PropTypes from 'prop-types';
import ConfigPoint from 'config-point';
import { ContextMenu } from '../';

const contextMenus = ConfigPoint.createConfiguration('contextMenus', {
  imageAreaMenus: [
    // Show the site selection sub-menu
    {
      id: 'siteSelectionMenu',
      selector: ({ nearbyToolData }) => nearbyToolData,
      items: [
        // this comes from config file
      ],
    },
    {
      id: 'seriesLabellingSelectionMenu',
      selector: ({ nearbyToolData }) => !nearbyToolData,
      items: [
        // this comes from config file
      ],
    },
    {
      id: 'fiducialSiteSelectionMenu',
      selector: ({ nearbyToolData }, menuId) => menuId === 'fiducialSiteSelectionMenu',
      items: [
        // this comes from config file
      ],
    },
    {
      id: 'forExistingMeasurement',
      selector: ({ nearbyToolData }) => !!nearbyToolData,
      items: [
        {
          label: 'Delete measurement',
          actionType: 'Delete',
        },
        {
          label: 'Add Custom Label',
          actionType: 'SetLabel',
        },
      ],
    },
  ],
});

const ContextMenuMeasurements = ({ onGetMenuItems, ...props }) => {
  const menuItems = onGetMenuItems(contextMenus.imageAreaMenus, contextMenus.codingValues, props);

  return <ContextMenu items={menuItems} />;
};

/**
 * Gets the finding site for a given location object.
 * @param {Object} props
 * @returns a string containing the finding site.
 */
ContextMenuMeasurements.getFindingSite = props => {
  return contextMenus.getFindingSite(props);
};

ContextMenuMeasurements.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSetLabel: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onGetMenuItems: PropTypes.func.isRequired,
};

export default ContextMenuMeasurements;
