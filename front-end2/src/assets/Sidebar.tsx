const Sidebar = ({ children, selected}) => {
  

  return (
    
    <div
      className={`absolute top-0 right-0 h-full w-1/5 bg-white border-l p-2 overflow-auto transform transition-transform duration-300 ease-in-out text-black ${
        selected ? 'translate-x-0' : 'translate-x-full'
      }`}
    > { children } </div>
  );
};

export default Sidebar;
