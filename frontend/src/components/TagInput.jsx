// src/components/TagInput.jsx
import { useState, useRef, useEffect, useMemo } from "react";
import { colors } from "../styles";

export default function TagInput({ label, value, onChange, suggestions = [], placeholder = "Cerca..." }) {
  const [input, setInput] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const tags = value ? value.split(",").map(s => s.trim()).filter(Boolean) : [];

  const filtered = useMemo(() => {
    if (!input.trim() || input.length < 1) return [];
    const term = input.toLowerCase().trim();
    const existingLower = tags.map(t => t.toLowerCase());
    return suggestions
      .filter(s => s.toLowerCase().includes(term) && !existingLower.includes(s.toLowerCase()))
      .slice(0, 10);
  }, [input, suggestions, tags]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
          inputRef.current && !inputRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addTag = (text) => {
    const tag = text.trim();
    if (!tag || tags.some(t => t.toLowerCase() === tag.toLowerCase())) return;
    const newTags = [...tags, tag];
    onChange(newTags.join(", "));
    setInput("");
    setShowDropdown(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const removeTag = (idx) => {
    const newTags = tags.filter((_, i) => i !== idx);
    onChange(newTags.join(", "));
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < filtered.length) {
        addTag(filtered[selectedIndex]);
      } else if (input.trim()) {
        addTag(input);
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    } else if (e.key === "Backspace" && !input && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <label style={labelStyle}>{label}</label>

      {/* Tags */}
      {tags.length > 0 && (
        <div style={tagContainer}>
          {tags.map((tag, idx) => (
            <span key={idx} style={tagStyle}>
              {tag}
              <button style={removeBtn} onClick={() => removeTag(idx)}
                onMouseEnter={e => e.currentTarget.style.color = colors.danger}
                onMouseLeave={e => e.currentTarget.style.color = colors.accent}
              >x</button>
            </span>
          ))}
        </div>
      )}

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        placeholder={tags.length > 0 ? "Aggiungi altro..." : placeholder}
        style={inputStyle}
        value={input}
        onChange={e => { setInput(e.target.value); setShowDropdown(e.target.value.length >= 1); setSelectedIndex(-1); }}
        onKeyDown={handleKeyDown}
        onFocus={() => { if (input.length >= 1) setShowDropdown(true); }}
      />

      {/* Dropdown */}
      {showDropdown && filtered.length > 0 && (
        <div style={dropdownStyle}>
          {filtered.map((item, idx) => (
            <div
              key={item}
              style={{
                ...dropdownItem,
                background: idx === selectedIndex ? colors.bgHover : 'transparent',
              }}
              onMouseEnter={() => setSelectedIndex(idx)}
              onClick={() => addTag(item)}
            >
              {item}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const labelStyle = {
  display: 'block', fontSize: 11, color: colors.textMuted, fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4,
};

const tagContainer = {
  display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4,
  padding: '6px 8px', borderRadius: 8, border: `1px solid ${colors.border}`,
  background: colors.bgDeep, minHeight: 32,
};

const tagStyle = {
  display: 'inline-flex', alignItems: 'center', gap: 4,
  background: colors.accentLight, border: `1px solid ${colors.borderActive}`,
  color: '#2dd4bf', padding: '2px 8px', borderRadius: 12,
  fontSize: 11, fontWeight: 500,
};

const removeBtn = {
  background: 'none', border: 'none', color: colors.accent, cursor: 'pointer',
  fontSize: 12, padding: 0, lineHeight: 1, fontWeight: 'bold',
};

const inputStyle = {
  width: '100%', padding: '8px 10px', borderRadius: 8,
  border: `1px solid ${colors.border}`, background: colors.bgDeep,
  color: colors.textPrimary, fontSize: 12, outline: 'none',
};

const dropdownStyle = {
  position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
  background: colors.bgSurface, border: `1px solid ${colors.border}`,
  borderRadius: 8, boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
  zIndex: 200, maxHeight: 200, overflow: 'auto',
};

const dropdownItem = {
  padding: '7px 10px', cursor: 'pointer', fontSize: 12,
  color: colors.textPrimary, transition: 'background 100ms ease',
};
