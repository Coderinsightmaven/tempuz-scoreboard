/**
 * Utility function for combining CSS class names.
 * 
 * Wrapper around clsx for consistent className handling throughout the app.
 * Handles conditional classes, arrays, and objects.
 * 
 * @param inputs - Class names (strings, arrays, objects, or combinations)
 * @returns Combined class name string
 * 
 * Example:
 * cn('base-class', isActive && 'active', { disabled: isDisabled })
 * // Returns: 'base-class active' or 'base-class disabled' etc.
 */
// src/utils/cn.ts
import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
} 