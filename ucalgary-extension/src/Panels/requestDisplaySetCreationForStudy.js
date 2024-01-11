function requestDisplaySetCreationForStudy(
  dataSource,
  DisplaySetService,
  StudyInstanceUID,
  madeInClient
) {
  // TODO: is this already short-circuited by the map of Retrieve promises?
  if (
    DisplaySetService.activeDisplaySets.some(
      displaySet => displaySet.StudyInstanceUID === StudyInstanceUID
    )
  ) {
    console.warn('Display set already exists for Study ', StudyInstanceUID);
    console.trace();
    return;
  }

  console.warn('Retrieve metadata for Study ', StudyInstanceUID);
  console.trace();
  dataSource.retrieve.series.metadata({ StudyInstanceUID, madeInClient });
}

export default requestDisplaySetCreationForStudy;
