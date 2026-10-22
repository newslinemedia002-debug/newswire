export default function ArticleBody({ content }) {
  const paragraphs = String(content || '')
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean)

  if (paragraphs.length === 0) {
    return <p style={{ color: 'var(--muted)' }}>This story has no body yet.</p>
  }

  return (
    <div>
      {paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  )
}
