export type ActionData<T> = {
  formError?: string[];
  fieldErrors?: {
    [P in keyof T]?: string[];
  };
  fields?: T;
};
