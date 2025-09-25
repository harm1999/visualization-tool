//SearchBox.tsx

import React, { useState, useEffect, useRef } from "react";
import { useStore } from '../../data/store';
import { getNode, findName } from '../../utils/apiHelper';
import { Search } from "lucide-react";  // example icons

const SearchBox = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [active, setActive] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLUListElement | null>(null);

  const activeNodes = useStore(state => state.activeNodes)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActive(false);
      }
    };

    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);

    // Cleanup function
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);

  // Effect to fetch search suggestions when searchTerm changes (with debounce)
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (!searchTerm) {
        // If query is empty, clear results and do nothing
        setSearchResults([]);
        return;
      }

      // Fetch data from external API
      findName(searchTerm)
        .then(data => {
          console.log(data.matches)
          setSearchResults(data.matches || []); 
        })
    }, 300);  // 300ms debounce delay
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);
  const name_mapping = {
    Container: "Package",
    Structure: "Class"
  }

  const filtered = searchResults
    .filter(({ name }) => activeNodes[name] === 0);

  return (
    <div><h2 className="text-sm font-semibold mb-2 w-full">Add nodes</h2>
    <div className="relative px-3 mb-2">
      
    {/* Search Icon inside input */}
    <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
      <Search className="h-4 w-4 text-gray-400" />
    </span>
    <input 
      placeholder="Search..." 
      value={searchTerm} 
      onChange={e => setSearchTerm(e.target.value)}
      onFocus={e => {setSearchTerm(e.target.value); setActive(true);}}
      className="pl-10 bg-gray-800 text-gray-100 placeholder-gray-400 focus:outline-none 
                  focus:ring-2 focus:ring-gray-600 rounded-md bg-tool-dark"
    />
    {/* Suggestions dropdown */}
    {active && searchTerm && (
      <ul 
        ref={dropdownRef}
        className="absolute top-full left-0 mt-1 bg-gray-800 text-gray-100 rounded-md shadow-lg max-h-60 overflow-y-auto z-10 w-max min-w-[200px]">

        {loading ? (
              <li className="px-4 py-2 text-xs text-gray-400">
                Searching...
              </li>
            ) : filtered.length === 0 ? (
              <li className="px-4 py-2 text-xs text-gray-400">
                No results found
              </li>
            ) : (
              filtered.map(({name, id, node}) => (
                <li
                  key={id}
                  className="px-4 py-2 text-xs hover:bg-gray-700 cursor-pointer"
                  onClick={() => getNode(id, setLoading)}
                >
                  {name} {node?.labels && (`(${node.labels.map(item => name_mapping[item]).join(", ")})`)}
                </li>
              ))
            )}

      </ul>
    )}
  </div></div>);
}

export default SearchBox;