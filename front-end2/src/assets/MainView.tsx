import { useRef, useState } from "react";

const MainView = ( { children, className = "", selected = false, containerRef = null } ) => {

    if (!containerRef) return;

    return (
        
        <div className={"flex-grow h-full w-full " + className} >
            <div className="flex h-full relative overflow-hidden">
                {/* Graph container: width adjusts when sidebar is shown */}
                <div
                ref={containerRef}
                className={`h-full transition-all duration-300 ease-in-out ${
                    selected ? 'w-4/5' : 'w-full'
                }`}
                />
                    {children}

                {/* Sliding Sidebar */}

            </div>
        </div>
    );

}

export default MainView;