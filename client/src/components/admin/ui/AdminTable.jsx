import './styles';

export default function AdminTable({
  columns,
  isLoading = false,
  isEmpty = false,
  emptyLabel = 'Nothing here yet',
  skeletonRows = 6,
  children,
}) {
  return (
    <div className="adm-table-wrap">
      <table className="adm-table">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key} scope="col" style={col.width ? { width: col.width } : undefined}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: skeletonRows }).map((_, r) => (
              <tr key={`skel-${r}`}>
                {columns.map(col => (
                  <td key={col.key}><div className="adm-skel-line" /></td>
                ))}
              </tr>
            ))
          ) : isEmpty ? (
            <tr>
              <td colSpan={columns.length} className="adm-table-empty">{emptyLabel}</td>
            </tr>
          ) : children}
        </tbody>
      </table>
    </div>
  );
}
