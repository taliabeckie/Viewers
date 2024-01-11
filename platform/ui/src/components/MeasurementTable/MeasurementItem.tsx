import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Icon from '../Icon';

function MeasurementActionIcon({ iconName, onClick, visible }) {
  return onClick && iconName ? (
    <div className="max-w-4 max-h-4">
      <Icon
        className="h-4 w-4 cursor-pointer text-white"
        name={iconName}
        onClick={onClick}
        style={{
          transform: visible ? '' : 'translateX(100%)',
          transition: 'transform 300ms, opacity 300ms',
          opacity: visible ? '100%' : '0%',
        }}
      />
    </div>
  ) : (
    <div className="hidden"></div>
  );
}

const MeasurementItem = ({
  uid,
  color,
  index,
  label,
  displayText,
  isActive,
  // isLocked,
  onClick,
  onEdit,
  visible,
  onChangeVisibility,
  // item,
  onDelete,
}) => {
  const [isHovering, setIsHovering] = useState(false);

  const onEditHandler = event => {
    event.stopPropagation();
    onEdit({ uid, isActive, event });
  };

  const onChangeVisibilityHandler =
    onChangeVisibility &&
    (event => {
      event.stopPropagation();
      onChangeVisibility({ uid, visible, event });
    });

  const onDeleteHandler =
    onDelete &&
    (event => {
      event.stopPropagation();
      onDelete({ uid, event });
    });
  const onClickHandler = event => onClick({ uid, isActive, event });

  const onMouseEnter = () => setIsHovering(true);
  const onMouseLeave = () => setIsHovering(false);

  const itemStyle = {
    borderColor: typeof onChangeVisibility === 'function' ? color : 'transparent',
  };

  const actionIcons = [
    // {
    //   iconName: visible ? 'eye-visible' : 'eye-hidden',
    //   onClick: onChangeVisibilityHandler,
    //   visible: isActive || isHovering,
    // },
    {
      iconName: 'pencil',
      onClick: onEditHandler,
      visible: isActive || isHovering,
    },
    {
      iconName: 'old-trash',
      onClick: onDeleteHandler,
      visible: isActive || isHovering,
    },
  ];

  return (
    <div
      className={classnames(
        'group flex cursor-pointer border border-transparent bg-black outline-none transition duration-300',
        {
          'border-primary-light overflow-hidden rounded': isActive,
        }
      )}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClickHandler}
      role="button"
      tabIndex="0"
      data-cy={'measurement-item'}
    >
      <div
        className={classnames('w-6 py-1 text-center text-base transition duration-300', {
          'bg-primary-light active text-black': isActive,
          'bg-primary-dark text-primary-light group-hover:bg-secondary-main': !isActive,
        })}
      >
        {index}
      </div>
      <div
        className="border-l-1.5 relative flex flex-1 flex-row px-2 py-1"
        style={itemStyle}
      >
        <div className="infos pr-5px flex w-32 flex-col break-all">
          <div className="text-primary-light mb-1 text-base">{label}</div>
          {displayText.map(line => (
            <div
              key={line}
              className="pl-2 text-base text-white"
              dangerouslySetInnerHTML={{ __html: line }}
            ></div>
          ))}
        </div>
        <div className="actions ml-5px flex h-fit w-16 flex-row flex-wrap items-start justify-end gap-2 py-1">
          {actionIcons.map((props, index) => (
            <MeasurementActionIcon
              key={index.toString()}
              {...props}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

MeasurementItem.propTypes = {
  uid: PropTypes.oneOfType([PropTypes.number.isRequired, PropTypes.string.isRequired]),
  index: PropTypes.number.isRequired,
  label: PropTypes.string,
  displayText: PropTypes.array.isRequired,
  color: PropTypes.string,
  isActive: PropTypes.bool,
  visible: PropTypes.bool,
  onClick: PropTypes.func,
  onEdit: PropTypes.func,
  onChangeVisibility: PropTypes.func,
  onDelete: PropTypes.func,
};

MeasurementItem.defaultProps = {
  isActive: false,
};

export default MeasurementItem;
