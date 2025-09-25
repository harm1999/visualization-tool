
import { ChevronDownIcon } from 'lucide-react';
import { useState } from 'react';

const CollapsibleSection = ({
  title,
  level = 2,
  children,
  defaultOpen = true
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const Tag = `h${level}`;

  // e.g. size = 2rem at level 1, 1.75rem at level 2, ... down to 1rem
  const base = 2; // rem at level=1
  const step = 0.3;
  const remSize = Math.max(1, base - (level - 1) * step);

  return (
    <div className="mb-4">
      <div
        className="flex items-center cursor-pointer select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <ChevronDownIcon
          style={{
            width: `${remSize}rem`,
            height: `${remSize}rem`,
          }}
          className={`transition-transform duration-200 ${
            isOpen ? 'rotate-0' : '-rotate-90'
          }`}
        />
        <Tag className="text-sm font-semibold ml-2 break-words">
          {title}
        </Tag>
      </div>
      {isOpen && <div className="pl-2 mt-2">{children}</div>}
    </div>
  );
};


export default CollapsibleSection;