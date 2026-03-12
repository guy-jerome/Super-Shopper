// Shared singleton so useShoppingStore can read the household ID
// without creating a circular import with useHouseholdStore.
let currentHouseholdId: string | null = null;

export const getHouseholdId = () => currentHouseholdId;
export const setHouseholdId = (id: string | null) => {
  currentHouseholdId = id;
};
