import { useState } from "react";

const Toolbar = ({ children, toolbarPos, toolbarVisible }) => {

    if (!toolbarVisible) return;

    return (

        <div
          style={{
            position: 'absolute',
            left: toolbarPos.x,
            top: toolbarPos.y,
            transform: 'translate(-0%, -100%)',
            background: '#fff',
            border: '1px solid #ccc',
            borderRadius: 4,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            padding: '8px',
            zIndex: 10,
          }}
        >
            { children }
        </div>
    )
}

export default Toolbar;