import React, { useEffect } from 'react';
import { useCine, useViewportGrid } from '@ohif/ui';
import CinePlayer from './CinePlayer';

export default function ToolbarCinePlayer({ commandsManager }) {
  const [{ isCineEnabled, cines, previousCines }, cineService] = useCine();

  const [
    { activeViewportIndex, viewports },
    viewportGridService,
  ] = useViewportGrid();

  const cine = cines[activeViewportIndex] || {};
  const isPlaying = (cine && cine.isPlaying) || false;
  const frameRate = (cine && cine.frameRate) || 24;

  useEffect(() => {
    const viewportsToUpdate = [];
    let playOptions = {};

    // one or many of same
    // here we look for changed cines only to apply autoscroll changes
    Object.keys(cines).forEach(cineIndex => {
      const _cine = cines[cineIndex] || {};
      const _isPlaying = _cine.isPlaying || false;
      const _frameRate = _cine.frameRate || 24;

      const _prevCine = (previousCines || {})[cineIndex] || {};
      if (
        _prevCine.isPlaying !== _isPlaying ||
        (_prevCine.frameRate !== _frameRate && _isPlaying)
      ) {
          viewportsToUpdate.push({
            viewportIndex: cineIndex,
            displaySetInstanceUIDs: viewports[cineIndex].displaySetInstanceUIDs,
          });

          // assuming there is only one playOptions for all is a correct assumption,
          // as far cine(s) op will be one or many of same type.
          playOptions = {
            play: _isPlaying,
            frameRate: _frameRate,
          };

      }
    });

    commandsManager.runCommand('autoScroll', {
      playOptions,
      viewports: viewportsToUpdate,
    });
  }, [cines]);

  const howManyIsPlaying = Object.keys(cines).reduce((acc, currentIndex) => {
    if (cines[currentIndex].isPlaying) {
      acc += 1;
    }
    return acc;
  }, 0);

  const hasManyPlaying = howManyIsPlaying > 1;

  return (
    isCineEnabled && (
      <CinePlayer
        viewportIndexRef={activeViewportIndex}
        frameRate={frameRate}
        isPlaying={isPlaying}
        hasManyPlaying={hasManyPlaying}
        onPlayPauseChange={isPlaying => {
          cineService.setCine({ id: activeViewportIndex, isPlaying });
        }}
        onPlayPauseAllChange={(isPlaying, frameRate) => {
          const args = {
            ids: viewportGridService.getViewportIndexes(),
            isPlaying,
          };

          // on trigger play frameRate should be updated
          if (isPlaying && frameRate) {
            args.frameRate = frameRate;
          }
          cineService.setCineAll(args);
        }}
        onFrameRateChange={frameRate => {
          let ids = [];

          // on changing frameRate and many including current viewport is playing,
          // should change all other viewports frameRate
          if (isPlaying && hasManyPlaying) {
            ids = viewportGridService.getViewportIndexes();
          } else {
            ids = [activeViewportIndex];
          }

          cineService.setCineAll({ ids, frameRate });
        }}
      />
    )
  );
}
