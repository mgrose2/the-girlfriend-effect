/**
 * Route map for the root stack. Screens are added here as each sprint lands
 * them; typed params are what keep navigation honest as the flow grows.
 */
export type RootStackParamList = {
  RoleSelect: undefined;
  BoardList: undefined;
  CreateBoard: undefined;
  BoardEditor: { boardId: string };
  /**
   * `imageUrl` present means the camera-roll path picked it already (a local
   * file URI in Sprint 2; 3.6 uploads it). Absent means the screen asks for a
   * link instead.
   */
  PinDetails: { boardId: string; imageUrl?: string };
  ShareBoard: { boardId: string };
  JoinBoard: undefined;
  SizingIntake: { boardId: string };
  BoardReceived: { boardId: string };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
