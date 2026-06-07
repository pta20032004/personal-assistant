'use client';
import { useState, useEffect } from 'react';

export function NotepadSection() {
  const [content, setContent] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('notepad-content');
    if (saved) {
      setContent(saved);
    }
  }, []);

  // Auto-save to localStorage
  useEffect(() => {
    if (content === '') return;
    
    const timer = setTimeout(() => {
      setIsSaving(true);
      localStorage.setItem('notepad-content', content);
      setLastSaved(new Date());
      setTimeout(() => setIsSaving(false), 500);
    }, 1000);

    return () => clearTimeout(timer);
  }, [content]);

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>Notepad</h2>
        <div className="muted" style={{ fontSize: 11 }}>
          {isSaving ? (
            'Saving...'
          ) : lastSaved ? (
            `Saved ${lastSaved.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
          ) : (
            'Not saved yet'
          )}
        </div>
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Start writing..."
        style={{
          width: '100%',
          minHeight: '300px',
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          color: 'var(--text)',
          padding: '20px',
          fontFamily: 'Inter, monospace',
          fontSize: '14px',
          lineHeight: '1.8',
          resize: 'vertical',
          transition: 'border-color 0.2s',
        }}
      />
    </div>
  );
}
