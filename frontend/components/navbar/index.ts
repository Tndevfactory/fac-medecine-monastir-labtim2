export { default } from './navbar';
export { default as MobileMenu } from './MobileMenu';
export { default as AnimatedBurgerMenu } from './AnimatedBurgerMenu';
export * from './types';

export interface NavItem {
  name: string;
  href: string;
  hasDropdown?: boolean;
  subItems?: {
    name: string;
    href: string;
  }[];
}

export interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  navItems: NavItem[];
}