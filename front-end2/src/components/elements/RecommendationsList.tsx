import { useState } from 'react';
import { getNode, findName } from '../../utils/apiHelper';
import { useStore } from '../../data/store';

const RecommendationsList = () => {

  const [loading, setLoading] = useState(false);
  
  const recommendations = useStore(s => s.recommendations);


  return (
    <div className="relative px-3 mb-2 w-full">
      {
      (recommendations.length>0 && (<div><h2 className="text-sm font-semibold mb-2 w-full">Recommended next nodes</h2>
      <ul 
        className="top-full left-0 mt-1 bg-gray-800 text-gray-100 rounded-md shadow-lg ">

        {loading ? (
              <li className="px-4 py-2 text-xs text-gray-400">
                Finding recommendations...
              </li>
            ) : recommendations.length === 0 ? (
              <li className="px-4 py-2 text-xs text-gray-400">
                No recommendations
              </li>
            ) : (
              recommendations.map(({name, id}) => (
                <li
                  key={id}
                  className="px-4 py-2 text-xs hover:bg-gray-700 cursor-pointer name-container rounded-md"
                  onClick={() => getNode(id, setLoading)}
                >
                  <span className="name">{name}</span>
                  <span className="tooltip">{name}</span>
                </li>
              ))
            )}

      </ul>
      </div>))
      }
    </div>
  );
}

export default RecommendationsList;
