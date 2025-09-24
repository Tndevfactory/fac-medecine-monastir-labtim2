'use client';

interface AnimatedBurgerMenuProps {
  isOpen: boolean;
  onClick: () => void;
}

export default function AnimatedBurgerMenu({ isOpen, onClick }: AnimatedBurgerMenuProps) {
  return (
    <button
      onClick={onClick}
      className="2xl:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors duration-200 relative w-10 h-10 flex items-center justify-center"
      aria-label="Toggle menu"
    >
      <div className="w-6 h-6 relative flex flex-col justify-center">
        {/* Top line */}
        <span
          className={`absolute left-0 w-6 h-0.5 bg-current transform transition-all duration-300 ease-in-out origin-center ${
            isOpen 
              ? 'rotate-45' 
              : 'rotate-0 -translate-y-1.5'
          }`}
        />
        
        {/* Middle line */}
        <span
          className={`absolute left-0 w-6 h-0.5 bg-current transform transition-all duration-300 ease-in-out origin-center ${
            isOpen 
              ? 'opacity-0 scale-0' 
              : 'opacity-100 scale-100'
          }`}
        />
        
        {/* Bottom line */}
        <span
          className={`absolute left-0 w-6 h-0.5 bg-current transform transition-all duration-300 ease-in-out origin-center ${
            isOpen 
              ? '-rotate-45' 
              : 'rotate-0 translate-y-1.5'
          }`}
        />
      </div>
    </button>
  );
}