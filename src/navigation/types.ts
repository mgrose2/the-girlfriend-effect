/**
 * Route map for the root stack. Screens are added here as each sprint lands
 * them; typed params are what keep navigation honest as the flow grows.
 */
export type RootStackParamList = {
  RoleSelect: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
