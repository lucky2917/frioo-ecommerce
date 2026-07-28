import { getStatusPresentation } from '../../../utils/orderStatus';
import './styles';

export default function StatusChip({ status }) {
  const { label, tone } = getStatusPresentation(status);
  return <span className={`adm-chip adm-chip--${tone}`}>{label}</span>;
}
