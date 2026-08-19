export default function Badge({ children, variant = 'info' }) {
  const variants = {
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    info: 'badge-info',
    gray: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700',
  }
  return <span className={variants[variant]}>{children}</span>
}
