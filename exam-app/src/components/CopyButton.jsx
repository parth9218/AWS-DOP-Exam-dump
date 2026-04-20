import { useState } from 'react';

export default function CopyButton({ question, className = '', children, copiedChildren = '✅ Copied' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    let text = `${question.title}\n\n${question.body}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button onClick={handleCopy} className={className} title="Copy full question for AI">
      {copied ? copiedChildren : (children || '📋 Copy')}
    </button>
  );
}
