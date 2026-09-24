/**
 * Route map for the root stack. Screens are added here as each sprint lands
 * them; typed params are what keep navigation honest as the flow grows.
 */
export type RootStackParamList = {
  RoleSelect: undefined;
  BoardList: undefined;
  CreateBoard: undefined;
  BoardEditor: { boardId: string };
  /** `imageUrl` is a local file URI in Sprint 2; 3.6 uploads it. */
  PinDetails: { boardId: string; imageUrl: string };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
