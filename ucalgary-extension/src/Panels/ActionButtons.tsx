import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import { Button, ButtonGroup } from '@ohif/ui';

function ActionButtons({ commandsManager, servicesManager }) {
  const { t } = useTranslation('MeasurementTable');
  const { ToolBarService } = servicesManager.services;
  const actionButtonsList = ToolBarService?.getButtons()?.ActionButtons;
  const items = actionButtonsList?.props?.items || [];

  return (
    <React.Fragment>
      <ButtonGroup color="primary" size="inherit">
        {items.map(
          item =>
            item && (
              <Button
                color="default"
                key={item.id}
                className="px-2 py-2 text-base"
                onClick={() =>
                  item.commands.forEach(command =>
                    commandsManager.runCommand(
                      command.commandName,
                      command.commandOptions
                    )
                  )
                }
              >
                {item.label}
              </Button>
            )
        )}
      </ButtonGroup>
    </React.Fragment>
  );
}

export default ActionButtons;
