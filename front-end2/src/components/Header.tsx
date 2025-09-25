import React, {useRef} from "react";
import {
  Navbar,
  MobileNav,
  Typography,
  Button,
  Menu,
  MenuHandler,
  MenuList,
  MenuItem,
  Avatar,
  Card,
  IconButton,
  Collapse,
} from "@material-tailwind/react";
import {
  CubeTransparentIcon,
  UserCircleIcon,
  CodeBracketSquareIcon,
  Square3Stack3DIcon,
  ChevronDownIcon,
  ChartBarSquareIcon,        // Graph
  ArrowUpOnSquareIcon,       // Upload
  ArrowsRightLeftIcon,       // Toggle view
  Cog6ToothIcon,             // Settings
  Bars2Icon,
  PlusCircleIcon,         // Add node
  ShareIcon,              // Edges
  ArrowPathIcon,
  LinkIcon
} from "@heroicons/react/24/solid";
import { injectData, injectTrace } from "../utils/apiHelper"

const handleButtonUpload = (ref) => {
  ref.current.value = null;
  // 2) open the file picker
  ref.current.click();
};

const handleFileChange = async (e, func) => {
  e.preventDefault();
  console.log(e)

  const file = e.target.files[0];

  const reader = new FileReader();
  
  reader.onload = async(evt) => {
    const text = evt.target.result;
    console.log(text)
    func(text)
  }
  reader.readAsText(file);
};

const handleFileUpload = async (e, func) => {
  e.preventDefault();

  const file = e.target.files[0];

  const formData = new FormData();
  formData.append('file', file, file.name)

  try {
    const res = await fetch('http://127.0.0.1:5000/upload-trace/', {
      method: 'POST',
      body: formData,
      // NOTE: do NOT set Content-Type header; the browser will add the correct boundary
    });

    if (!res.ok) {
      throw new Error(`Server responded ${res.status}`);
    }
    const data = await res.json();
  
  } catch (err) {
  
  }
};

function NavItemMenu({label, icon, onclick, children}) {
    return (
    <Typography
        key={label}
        as="a"
        variant="small"
        color="gray"
        className="font-medium text-white"
        onClick={onclick}
    >
        <MenuItem className="flex items-center gap-2 lg:rounded-full bg-tool-blue hover:text-white text-xs">
        {React.createElement(icon, { className: "h-[18px] w-[18px]" })}{" "}
        <span> {label}</span>
        {children}
        </MenuItem>
    </Typography>)
}
 
function NavListMenu({title, elements, Icon}) {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  
  const renderItems = elements.map(({ title, onclick, children }) =>
    <a key={title}>
      <MenuItem onClick={onclick} className="text-xs">
        <Typography variant="h6" color="black" className="mb-1 text-xs">
          {title}
        </Typography>
        {children}
      </MenuItem>
    </a>);


  return (
    <React.Fragment>
      <Menu allowHover open={isMenuOpen} handler={setIsMenuOpen}>
        <MenuHandler>
          <Typography as="a" variant="small" className="font-normal">
            <MenuItem className="hidden items-center gap-2 font-medium text-white lg:flex lg:rounded-full bg-tool-blue text-xs">
              {Icon && <Icon className="h-[18px] w-[18px] text-white" />}{` ${title} `}
              <ChevronDownIcon
                strokeWidth={2}
                className={`h-3 w-3 transition-transform ${
                  isMenuOpen ? "rotate-180" : ""
                }`}
              />
            </MenuItem>
          </Typography>
        </MenuHandler>
        <MenuList className="hidden w- overflow-visible lg:grid">
          <ul className="col-span-4 flex w-full flex-col gap-1">
            {renderItems}
          </ul>
        </MenuList>
      </Menu>
      <MenuItem className="flex items-center gap-2 font-medium text-black lg:hidden">
        <Square3Stack3DIcon className="h-[18px] w-[18px] text-black" />{" "}
        {title}{" "}
      </MenuItem>
      <ul className="ml-6 flex w-full flex-col gap-1 lg:hidden">
        {renderItems}
      </ul>
    </React.Fragment>
  );
}

function NavList({onclicks={}}) {
  const fileInputRef = useRef(null);
  const traceInputRef = useRef(null);
    const navListItems = [
        {
            label: "Graph",
            elements: [
                {
                    title: "Fit graph",
                    onclick: onclicks.refit
                },
                {
                    title: "Relayout",
                    onclick: onclicks.relayout
                },
                {
                    title: "Reset graph",
                    onclick: onclicks.resetGraph
                },
                {
                    title: "Group by layer",
                    onclick: onclicks.groupByLayer
                },
                {
                    title: "Export image",
                    onclick: onclicks.exportImage
                },
                {
                    title: "Select trace",
                    onclick: onclicks.openTraces
                },


            ],
            icon: ChartBarSquareIcon
        },
        {
            label: "Upload",
            icon: ArrowUpOnSquareIcon,
            elements: [
                {
                  title: "Upload JSON",
                  onclick: () => handleButtonUpload(fileInputRef)
                },
                {
                  title: "Upload trace",
                  onclick: () => handleButtonUpload(traceInputRef)
                }
            ]
        },
        {
            label: "Toggle view",
            icon: ArrowsRightLeftIcon,
            onclick: onclicks.toggleDynamicView
        },
        {
            label: "Settings",
            icon: Cog6ToothIcon,
            onclick: onclicks.openSettings
        },
        {
            label: "Add node",
            icon: PlusCircleIcon,
            onclick: onclicks.openSearch
        },
        {
            label: "Filter edges",
            icon: ShareIcon,
            onclick: onclicks.openEdgeTypes

        }
    ];

  return (
  <>
    <input
      type="file"
      accept=".json"
      ref={fileInputRef}
      className="hidden"
      onChange={(e) => handleFileChange(e, injectData)}
    />
    <input
      type="file"
      accept=".xml"
      ref={traceInputRef}
      className="hidden"
      onChange={(e) => handleFileUpload(e, injectTrace)}
    />
    <ul className="mt-2 mb-4 flex flex-col gap-2 lg:mb-0 lg:mt-0 lg:flex-row lg:items-center">
        {navListItems.map(({ label, icon, elements, onclick, children=null }, key) => (
        elements 
            ? <NavListMenu key={key} title={label} elements={elements} Icon={icon}/>
            : <NavItemMenu key={key} label={label} icon={icon} onclick={onclick}>
                {children}
              </NavItemMenu>
        ))}
    </ul>
    </>
  );
}
 
type HeaderProps = {
  className?: string;
  onclicks?: object;
};

export const Header: React.FC<HeaderProps> = ({className="", onclicks={}}) => {
  const [isNavOpen, setIsNavOpen] = React.useState(false);


  const toggleIsNavOpen = () => setIsNavOpen((cur) => !cur);
 
  React.useEffect(() => {
    window.addEventListener(
      "resize",
      () => window.innerWidth >= 960 && setIsNavOpen(false),
    );
  }, []);
 
  return (
    <Navbar className={` p-2 ${className} bg-heade border-none`}>
      <div className="w-full grid grid-cols-5 items-center text-black">
        <Typography className="col-span-1 ml-2 cursor-pointer py-1.5 font-medium h-full"/>
        <div className="col-span-3 hidden lg:flex justify-center">
          <NavList onclicks={onclicks}/>
        </div>
      </div>

      <Collapse open={isNavOpen} className="overflow-scroll">
        <NavList />
      </Collapse>
    </Navbar>
  );
}