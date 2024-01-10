import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

const defaults = {
  color: 'test',
  fullWidth: false,
  rounded: 'none',
  size: 'medium',
  variant: 'contained',
};

const roundedClasses = {
  none: '',
  small: 'rounded',
  medium: 'rounded-md',
  large: 'rounded-lg',
  full: 'rounded-full',
};

const variantClasses = {
  text: {
    test: '',
    hoverless: 'text-primary-light focus:bg-primary-light focus:text-white',
    default:
      'text-primary-light hover:bg-primary-light hover:text-white active:opacity-80 focus:bg-primary-light focus:text-white',
    primary:
      'text-primary-main hover:bg-primary-main hover:text-white active:opacity-80 focus:bg-primary-main focus:text-white',
    secondary:
      'text-secondary-light hover:bg-secondary-light hover:text-white active:opacity-80 focus:bg-secondary-light focus:text-white',
    white:
      'text-white hover:bg-white hover:text-black active:opacity-80 focus:bg-white focus:text-black',
    black:
      'text-black hover:bg-black hover:text-white focus:bg-black focus:text-white active:opacity-80',
  },
  outlined: {
    default:
      'border bg-transparent border-primary-light text-primary-light hover:bg-primary-light hover:text-black focus:text-black focus:bg-primary-light active:opacity-80',
    primary:
      'border bg-transparent border-primary-main text-primary-main hover:opacity-80 active:opacity-100 focus:opacity-80',
    secondary:
      'border bg-transparent border-secondary-light text-secondary-light hover:opacity-80 active:opacity-100 focus:opacity-80',
    white:
      'border bg-transparent border-white text-white hover:opacity-80 active:opacity-100 focus:opacity-80',
    black:
      'border bg-black border-primary-main text-white hover:bg-primary-main focus:bg-primary-main hover:border-black focus:border-black',
  },
  contained: {
    default: 'bg-primary-light text-black hover:opacity-80 active:opacity-100 focus:opacity-80',
    primary: 'bg-primary-main text-white hover:opacity-80 active:opacity-100 focus:opacity-80',
    secondary: 'bg-secondary-light text-white hover:opacity-80 active:opacity-100 focus:opacity-80',
    white: 'bg-white text-black hover:opacity-80 active:opacity-100 focus:opacity-80',
    black: 'bg-black text-white hover:opacity-80 active:opacity-100 focus:opacity-80',
    light:
      'border bg-primary-light border-primary-light text-black hover:opacity-80 active:opacity-100 focus:opacity-80',
  },
  disabled: {
    default: 'cursor-not-allowed opacity-50 bg-primary-light text-black',
    primary: 'cursor-not-allowed opacity-50 bg-primary-main text-white',
    secondary: 'cursor-not-allowed opacity-50 bg-secondary-light text-white',
    white: 'cursor-not-allowed opacity-50 bg-white text-black',
    black: 'cursor-not-allowed opacity-50 bg-black text-white',
    light: 'cursor-not-allowed opacity-50 border bg-primary-light border-primary-light text-black',
  },
};

const sizeClasses = {
  small: 'py-2 px-2 text-sm min-w-md',
  medium: 'py-2 px-2 text-lg min-w-md',
  large: 'py-2 px-6 text-xl min-w-md',
  initial: '',
};

const fullWidthClasses = {
  true: 'flex w-full',
  false: 'inline-flex',
};

const Label = ({
  children,
  className,
  text,
  color = defaults.color,
  size = defaults.size,
  rounded = defaults.rounded,
  fullWidth = defaults.fullWidth,
  variant = defaults.variant,
  ...rest
}) => {
  const baseClasses = '';

  return (
    <label
      className={classnames(
        baseClasses,
        className,
        variantClasses[variant][color],
        roundedClasses[rounded],
        sizeClasses[size],
        fullWidthClasses[fullWidth]
      )}
      {...rest}
    >
      {text}
      {children}
    </label>
  );
};

Label.defaultProps = {
  color: defaults.color,
  children: '',
};

Label.propTypes = {
  children: PropTypes.node,
  color: PropTypes.oneOf(['default', 'primary', 'secondary', 'white', 'black', 'inherit', 'light']),
  size: PropTypes.oneOf(['small', 'medium', 'large', 'initial', 'inherit']),
  /** Button corner roundness  */
  rounded: PropTypes.oneOf(['none', 'small', 'medium', 'large', 'full']),
  variant: PropTypes.oneOf(['text', 'outlined', 'contained', 'disabled']),
  /** Whether the button should have full width  */
  fullWidth: PropTypes.bool,
};

export default Label;
