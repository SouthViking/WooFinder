import { petRemoveScene } from './removal';
import { petRegistrationScene } from './registration';
import { petOwnerRegistrationScene } from './owner-registration';
import { lostPetReportCreationScene } from './lost-report-creation';

export const petScenes = [ lostPetReportCreationScene, petRegistrationScene, petOwnerRegistrationScene, petRemoveScene ];