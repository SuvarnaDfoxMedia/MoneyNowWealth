// hooks/useAdminCrud.ts
import useCommonCrud, { CommonCrudProps } from "./useCommonCrud";

export const useAdminCrud = <T>(
  props: CommonCrudProps & { adminModule?: boolean },
) => {
  // Override the hook's internal behavior with a custom query function
  const { data, ...rest } = useCommonCrud<T>({
    ...props,
    // Pass a custom module name that will work with your structure
    module: props.adminModule ? `auth/${props.module}` : props.module,
  });

  return {
    data,
    ...rest,
  };
};
