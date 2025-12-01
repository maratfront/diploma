import React from 'react'

function CopyButton({ text, className = '' }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`btn-secondary transition-all duration-300 transform hover:scale-105 ${copied ? 'bg-green-500 text-white scale-110' : ''} ${className}`}
    >
      <div className={`${copied ? 'icon-check' : 'icon-copy'} text-lg mr-2 transition-all duration-300`}></div>
      {copied ? 'Скопировано!' : 'Копировать'}
    </button>
  );
}

export default CopyButton
