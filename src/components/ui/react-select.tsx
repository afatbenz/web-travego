import React from 'react';
import Select, {
  components,
  type ActionMeta,
  type GroupBase,
  type MultiValue,
  type SingleValue,
  type StylesConfig,
  type Props as ReactSelectPropsType,
} from 'react-select';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Option {
  value: string;
  label: string;
  icon?: string;
  isManual?: boolean;
}

const styles: StylesConfig<Option, boolean, GroupBase<Option>> = {
  control: (base, state) => ({
    ...base,
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    borderColor: state.isFocused ? '#4f6bff' : '#e9eef7',
    borderWidth: '1px',
    boxShadow: state.isFocused ? '0 0 0 2px rgba(79, 107, 255, 0.1)' : 'none',
    paddingLeft: '0.75rem',
    paddingRight: '0.75rem',
    minHeight: '2.75rem',
    '&:hover': {
      borderColor: '#4f6bff',
    },
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    borderColor: '#e9eef7',
    borderWidth: '1px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    marginTop: '0.25rem',
  }),
  menuList: (base) => ({
    ...base,
    paddingTop: '0.25rem',
    paddingBottom: '0.25rem',
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? '#eef3ff' : state.isFocused ? '#f9fafb' : 'white',
    color: '#1e293b',
    paddingLeft: '0.75rem',
    paddingRight: '0.75rem',
    paddingTop: '0.5rem',
    paddingBottom: '0.5rem',
    cursor: 'pointer',
    '&:active': {
      backgroundColor: '#eef3ff',
    },
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: '#eef3ff',
    color: '#1e293b',
    borderRadius: '9999px',
    paddingLeft: '0.5rem',
    paddingRight: '0.25rem',
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: '#1e293b',
    paddingLeft: '0',
    paddingRight: '0.25rem',
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: '#4f6bff',
    borderRadius: '9999px',
    padding: '0.125rem',
    '&:hover': {
      backgroundColor: '#d1d5db',
      color: '#1e293b',
    },
  }),
  placeholder: (base) => ({
    ...base,
    color: '#9ca3af',
  }),
  valueContainer: (base) => ({
    ...base,
    paddingTop: '0.125rem',
    paddingBottom: '0.125rem',
  }),
  indicatorsContainer: (base) => ({
    ...base,
    paddingLeft: '0',
  }),
  clearIndicator: (base) => ({
    ...base,
    padding: '0.25rem',
    color: '#9ca3af',
    '&:hover': {
      color: '#475569',
    },
  }),
  dropdownIndicator: (base) => ({
    ...base,
    padding: '0.25rem',
    color: '#9ca3af',
  }),
  input: (base) => ({
    ...base,
    color: '#1e293b',
  }),
};

export interface ReactSelectProps extends Omit<ReactSelectPropsType<Option, boolean, GroupBase<Option>>, 'options' | 'value' | 'onChange' | 'isMulti' | 'isClearable' | 'isDisabled'> {
  options: Option[];
  value?: MultiValue<Option> | SingleValue<Option>;
  onChange?: (
    value: MultiValue<Option> | SingleValue<Option>,
    actionMeta: ActionMeta<Option>
  ) => void;
  placeholder?: string;
  isMulti?: boolean;
  isClearable?: boolean;
  disabled?: boolean;
  className?: string;
}

export const ReactSelect = React.forwardRef<
  React.ComponentRef<typeof Select<Option, boolean, GroupBase<Option>>>,
  ReactSelectProps
>(({ options, value, onChange, placeholder, isMulti, isClearable, disabled, className, components: userComponents, ...props }, ref) => {
  return (
    <Select<Option, boolean, GroupBase<Option>>
      ref={ref}
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      isMulti={isMulti}
      isClearable={isClearable}
      isDisabled={disabled}
      styles={styles}
      components={{
        DropdownIndicator: (props) => (
          <components.DropdownIndicator {...props}>
            <svg
              className="h-4 w-4 opacity-50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </components.DropdownIndicator>
        ),
        ClearIndicator: (props) => (
          <components.ClearIndicator {...props}>
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </components.ClearIndicator>
        ),
        ...userComponents,
      }}
      className={cn("w-full", className)}
      {...props}
    />
  );
});
ReactSelect.displayName = "ReactSelect";

export { components };
