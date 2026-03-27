type Props = {
  unreadCount: number
  onClick: () => void
}

export function NewsMailbox({ unreadCount, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative rounded-lg border border-zinc-200 bg-white p-2 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
      aria-label={`MLB news, ${unreadCount} unread`}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
        <path d="M3 8l9 6 9-6M3 8v10a1 1 0 001 1h16a1 1 0 001-1V8M3 8l0-.001A2 2 0 015 6h14a2 2 0 012 2" />
      </svg>
      {unreadCount > 0 && (
        <span
          className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-0.5 text-[11px] font-medium text-white"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  )
}
