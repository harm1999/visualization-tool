// EdgeChecksPopup.tsx
import Popup from '../../assets/Popup';
import EdgeChecks from '../elements/EdgeChecks';

const EdgeChecksPopup = ({ open, onClose }) => (
  <Popup open={open} onClose={onClose} title="Edge Types">
    <EdgeChecks />
  </Popup>
);

export default EdgeChecksPopup