const SR_MODALITY = 'SR';

export default function getLatestSRInstanceFromStudy(study) {
  const { series } = study;
  const dicomSRSeries = series.filter(
    aSeries => aSeries.Modality === SR_MODALITY
  );

  if (!dicomSRSeries.length) {
    return;
  }

  const dicomSRInstances = dicomSRSeries.map(series => series.instances[0]);

  dicomSRInstances.sort((aSR, bSR) => {
    const seriesDateTimeA = Number(`${aSR.SeriesDate}${aSR.SeriesTime}`);
    const seriesDateTimeB = Number(`${bSR.SeriesDate}${bSR.SeriesTime}`);

    return seriesDateTimeB - seriesDateTimeA;
  });

  return dicomSRInstances[0];
}
