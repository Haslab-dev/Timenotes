interface LinkifiedTextProps {
  text: string
  className?: string
}

export function LinkifiedText({ text, className }: LinkifiedTextProps) {
  // Regex to match URLs, excluding trailing HTML tags
  const urlRegex = /(https?:\/\/[^\s<]+)/g

  const parts = text.split(urlRegex)

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.match(urlRegex)) {
          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 dark:text-indigo-400 font-bold decoration-indigo-600/30 underline-offset-4 hover:decoration-indigo-600 transition-all break-all"
              onClick={(e) => e.stopPropagation()} // Prevent triggering parent click handlers
            >
              {part}
            </a>
          )
        }
        return part
      })}
    </span>
  )
}
