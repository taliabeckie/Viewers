import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import debounce from 'lodash.debounce';
import { IconButton, Icon } from '@ohif/ui';

import './CinePlayerCustomInputRange.css';

const CinePlayer = ({
  isPlaying,
  hasManyPlaying,
  minFrameRate,
  maxFrameRate,
  stepFrameRate,
  frameRate: defaultFrameRate,
  onFrameRateChange,
  onPlayPauseChange,
  onPlayPauseAllChange,
  viewportIndexRef,
}) => {
  const [frameRate, setFrameRate] = useState(defaultFrameRate);
  const debouncedSetFrameRate = debounce(onFrameRateChange, 300);

  const onFrameRateChangeHandler = ({ target }) => {
    const frameRate = parseFloat(target.value);
    debouncedSetFrameRate(frameRate);
    setFrameRate(frameRate);
  };

  const onPlayPauseChangeHandler = () => onPlayPauseChange(!isPlaying);
  const onPlayPauseAllChangeHandler = () =>
    onPlayPauseAllChange(!hasManyPlaying, frameRate);

  useEffect(() => {
    setFrameRate(defaultFrameRate);
  }, [viewportIndexRef]);

  const action = {
    false: { icon: 'old-play' },
    true: { icon: 'old-stop' },
  };

  const actionAll = {
    false: { icon: 'play-all' },
    true: { icon: 'stop-all' },
  };

  function getButton(iconConfig, iconIndex, onClickHandler) {
    return (
      <IconButton
        variant="text"
        color="inherit"
        size="initial"
        className={
          iconIndex === 0
            ? 'ml-4 mr-1 text-primary-active'
            : 'ml-2 mr-1 text-primary-light'
        }
        onClick={onClickHandler}
      >
        <Icon width="15px" height="15px" name={iconConfig.icon} />
      </IconButton>
    );
  }

  function frameRateClassNamePick(allContent, singContent) {
    if (isPlaying && hasManyPlaying) {
      return allContent;
    }

    return singContent;
  }

  return (
    <div className="flex flex-row items-center justify-center h-10 ml-3 border rounded-full CinePlayer border-primary-light">
      {getButton(actionAll[hasManyPlaying], 0, onPlayPauseAllChangeHandler)}
      {getButton(action[isPlaying], 1, onPlayPauseChangeHandler)}
      <div
        className={`flex flex-col justify-center h-full pt-2 pl-1 pr-1 mr-3${frameRateClassNamePick(
          ' text-primary-active',
          ' text-primary-light'
        )}`}
      >
        <input
          className={frameRateClassNamePick('primary', '')}
          type="range"
          name="frameRate"
          min={minFrameRate}
          max={maxFrameRate}
          step={stepFrameRate}
          value={frameRate}
          onChange={onFrameRateChangeHandler}
        />
        <p className="-mt-2 text-sm">{`${frameRate.toFixed(1)} fps`}</p>
      </div>
    </div>
  );
};

const noop = () => {};

CinePlayer.defaultProps = {
  isPlaying: false,
  hasManyPlaying: false,
  minFrameRate: 1,
  maxFrameRate: 90,
  stepFrameRate: 1,
  frameRate: 24,
  onPlayPauseChange: noop,
  onFrameRateChange: noop,
};

CinePlayer.propTypes = {
  viewportIndexRef: PropTypes.number,
  /** Minimum value for range slider */
  minFrameRate: PropTypes.number.isRequired,
  /** Maximum value for range slider */
  maxFrameRate: PropTypes.number.isRequired,
  /** Increment range slider can "step" in either direction */
  stepFrameRate: PropTypes.number.isRequired,
  frameRate: PropTypes.number.isRequired,
  /** 'true' if playing, 'false' if paused */
  isPlaying: PropTypes.bool.isRequired,
  hasManyPlaying: PropTypes.bool.isRequired,
  onPlayPauseChange: PropTypes.func,
  onPlayPauseAllChange: PropTypes.func,
  onFrameRateChange: PropTypes.func,
};

export default CinePlayer;
