export interface NavItem {
  name: string;
  href: string;
  hasDropdown?: boolean;
  subItems?: {
    name: string;
    href: string;
  }[];
  children?: NavItem[];
}

export interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  navItems: NavItem[];
}