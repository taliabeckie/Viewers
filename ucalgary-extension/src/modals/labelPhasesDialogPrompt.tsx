/* eslint-disable react/display-name */
import React from 'react';
import { Dialog, Input } from '@ohif/ui';
import isInteger from 'core-js/fn/number/is-integer';

const RESPONSE = {
  //NO_NEVER: -1,
  CANCEL: 0,
  CREATE_REPORT: 1,
  // ADD_SERIES: 2,
  // SET_STUDY_AND_SERIES: 3,
  // NO_NOT_FOR_SERIES: 4,
};

export default function labelPhasesDialogPrompt(UIDialogService) {
  return new Promise(function (resolve, reject) {
    let dialogId = undefined;

    const _handleClose = () => {
      // Dismiss dialog
      UIDialogService.dismiss({ id: dialogId });
      // Notify of cancel action
      resolve({ action: RESPONSE.CANCEL, value: undefined });
    };

    /**
     *
     * @param {string} param0.action - value of action performed
     * @param {string} param0.value - value from input field
     */
    const _handleFormSubmit = ({ action, value }) => {
      UIDialogService.dismiss({ id: dialogId });
      switch (action.id) {
        case 'save':
          console.log(value.label);

          //resolve({action: RESPONSE.CREATE_REPORT, value: value.label2})
          console.log(value.label2);

          break;
        case 'cancel':
          resolve({ action: RESPONSE.CANCEL, value: undefined });
          break;
      }
    };

    dialogId = UIDialogService.create({
      centralize: true,
      isDraggable: true,
      content: Dialog,
      useLastPosition: false,
      showOverlay: true,
      contentProps: {
        title: 'Input phase numbers as integers: ',
        value: { label: '', label2: '' },
        noCloseButton: true,
        onClose: _handleClose,
        actions: [
          { id: 'cancel', text: 'Cancel', type: 'primary' },
          { id: 'save', text: 'Save', type: 'secondary' },
        ],

        onSubmit: _handleFormSubmit,
        body: ({ value, setValue }) => {
          const onChangeHandler = event => {
            event.persist();
            setValue(value => ({ ...value, label: event.target.value }));
          };
          const onChangeHandler2 = event => {
            event.persist();
            setValue(value => ({ ...value, label2: event.target.value }));
          };
          const onKeyPressHandler = event => {
            if (event.key === 'Enter') {
              UIDialogService.dismiss({ id: dialogId });
              resolve({
                action: RESPONSE.CREATE_REPORT, //THIS NEEDS TO BE CHANGED
                value: value.label,
              });
            }
          };
          return (
            <div className="bg-primary-dark p-4">
              <div>
                <label className="text-white">End-diastole: </label>
                <Input
                  autoFocus
                  className="border-primary-main mt-2 bg-black"
                  type="text"
                  containerClassName="mr-2"
                  value={value.label}
                  onChange={onChangeHandler}
                  onKeyPress={onKeyPressHandler}
                />
              </div>
              <div>
                <label className="text-white">End-systole: </label>
                <Input
                  autoFocus
                  className="border-primary-main mt-2 bg-black"
                  type="text"
                  containerClassName="mr-2"
                  value={value.label2}
                  onChange={onChangeHandler2}
                  onKeyPress={onKeyPressHandler}
                />
              </div>
            </div>
          );
        },
      },
    });
  });
}
