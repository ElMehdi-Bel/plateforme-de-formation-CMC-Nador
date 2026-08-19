export default function SkeletonTable({ rows = 5, cols = 5 }) {
  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i}><div className="skeleton h-4 w-24" /></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              {Array.from({ length: cols }).map((_, j) => (
                <td key={j}><div className="skeleton h-4 w-full" /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
