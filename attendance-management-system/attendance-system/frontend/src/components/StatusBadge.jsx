const STATUS_CLASS = {
  Present: 'badge badge--green',
  'Half-Day': 'badge badge--amber',
  Absent: 'badge badge--red',
  'On-Leave': 'badge badge--purple',
  Incomplete: 'badge badge--gray',
  Pending: 'badge badge--amber',
  Approved: 'badge badge--green',
  Rejected: 'badge badge--red'
};

export default function StatusBadge({ status }) {
  return <span className={STATUS_CLASS[status] || 'badge badge--gray'}>{status}</span>;
}
