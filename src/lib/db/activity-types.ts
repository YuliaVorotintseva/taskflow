export type ActivityMetadata = {
  title?: string;
  name?: string;
  slug?: string;
  position?: number;
  field?: string;

  fromColumnId?: string;
  fromColumnName?: string;
  toColumnId?: string;
  toColumnName?: string;

  columnId?: string;
  columnName?: string;
  oldValue?: string | number | null;
  newValue?: string | number | null;
};
