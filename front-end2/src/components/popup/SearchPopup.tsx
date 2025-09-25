// SearchPopup.tsx
import Popup from '../../assets/Popup';
import SearchBox from '../elements/SearchBox';

const SearchPopup = ({ open, onClose }) => (
  <Popup open={open} onClose={onClose} title="Search Nodes">
    <SearchBox />
  </Popup>
);

export default SearchPopup
