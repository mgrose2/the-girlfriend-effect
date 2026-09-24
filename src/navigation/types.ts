/**
 * Route map for the root stack. Screens are added here as each sprint lands
 * them; typed params are what keep navigation honest as the flow grows.
 */
export type RootStackParamList = {
  RoleSelect: undefined;
  BoardList: undefined;
  CreateBoard: undefined;
  BoardEditor: { boardId: string };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
