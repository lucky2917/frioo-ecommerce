import React from 'react';
import SearchResults from './SearchResults';

export default function SearchBar({ value, onChange, onSubmit, onFocus, onBlur, showResults, isSearching, results, onResultClick }) {
  return (
    <div className="fr-search">
      <form className="fr-search-form" onSubmit={onSubmit} role="search">
        <svg className="fr-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
        <input
          type="text"
          className="fr-search-input"
          placeholder="Search for mango, guava&hellip;"
          aria-label="Search products"
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </form>
      {showResults && <SearchResults isSearching={isSearching} results={results} onResultClick={onResultClick} />}
      <style>{`
        .fr-search { position: relative; width: 100%; max-width: 320px; }
        .fr-search-form { display: flex; align-items: center; gap: var(--fr-s2); height: 44px; padding: 0 var(--fr-s4); background: var(--fr-surface-2); border: 1px solid var(--fr-line); border-radius: var(--fr-r-pill); transition: border-color var(--fr-dur-quick) var(--fr-ease-standard), box-shadow var(--fr-dur-quick) var(--fr-ease-standard), background var(--fr-dur-quick) var(--fr-ease-standard); }
        .fr-search-form:focus-within { border-color: var(--fr-brand); box-shadow: 0 0 0 3px color-mix(in srgb, var(--fr-brand) 16%, transparent); background: var(--fr-surface); }
        .fr-search-icon { color: var(--fr-text-3); flex-shrink: 0; }
        .fr-search-input { flex: 1; min-width: 0; border: none; background: none; outline: none; font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-control); color: var(--fr-text); }
        .fr-search-input::placeholder { color: var(--fr-text-3); }
        @media (prefers-reduced-motion: reduce) { .fr-search-form { transition: none; } }
      `}</style>
    </div>
  );
}
