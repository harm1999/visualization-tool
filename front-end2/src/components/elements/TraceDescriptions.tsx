// src/components/TraceDescriptions.tsx
import React, { useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import CollapsibleSection from './CollapsibleSection';
import Markdown from 'react-markdown';
import { useTreeStore } from '@/data/treeStore';

export function TraceDescriptions({ selected }) {
  // Always call hooks in the same order
  const descriptions = useTreeStore((s) => s.descriptions);
  const raw = descriptions[selected.id()];
  const containerRef = useRef(null);

  useEffect(() => {
    if (!raw || !containerRef.current) return;

    const root = createRoot(containerRef.current);
    root.render(<Markdown>{raw}</Markdown>);

    return () => {
      root.unmount();
    };
  }, [raw]);

  // Conditional rendering after hooks
  if (!raw) return null;

  return (
    <CollapsibleSection title="Summary" level={2}>
      <div className="text-xs ml-2" ref={containerRef} />
    </CollapsibleSection>
  );
}

export default TraceDescriptions;
