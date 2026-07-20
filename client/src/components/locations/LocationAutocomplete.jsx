import { useEffect, useMemo, useRef, useState } from 'react';
import api from '../../api/client';

function displayOption(option) {
  return option?.displayName || option?.departmentName || option?.cityName || '';
}

function getOptionKey(option, type) {
  if (type === 'department') return option.departmentCode;
  return option.cityCode;
}

export default function LocationAutocomplete({
  type = 'city',
  value,
  onChange,
  values = [],
  onChangeMany,
  multiple = false,
  label,
  placeholder,
  required,
  departmentCode,
  disabled,
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef(null);

  const selectedMany = values || [];

  useEffect(() => {
    if (!multiple) {
      setQuery(value ? displayOption(value) : '');
    }
  }, [value, multiple]);

  useEffect(() => {
    if (disabled) return;
    const trimmed = query.trim();
    const shouldSearch = multiple ? trimmed.length > 0 : open && trimmed.length > 0;
    if (!shouldSearch) {
      setOptions([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/public/locations/search', {
          params: {
            type,
            query: trimmed,
            departmentCode: type === 'city' ? departmentCode : undefined,
            limit: 10,
          },
        });
        setOptions(Array.isArray(data) ? data : []);
        setActiveIndex(-1);
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => clearTimeout(timeout);
  }, [query, type, departmentCode, open, multiple, disabled]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!rootRef.current) return;
      if (rootRef.current.contains(event.target)) return;
      setOpen(false);
      if (!multiple) setQuery(value ? displayOption(value) : '');
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value, multiple]);

  const selectedCodes = useMemo(() => {
    const key = type === 'department' ? 'departmentCode' : 'cityCode';
    return new Set(selectedMany.map((item) => item?.[key]).filter(Boolean));
  }, [selectedMany, type]);

  const commitSingle = (option) => {
    onChange?.(option || null);
    setQuery(option ? displayOption(option) : '');
    setOpen(false);
  };

  const commitMany = (option) => {
    if (!option || !onChangeMany) return;
    const key = getOptionKey(option, type);
    if (!key || selectedCodes.has(key)) {
      setQuery('');
      setOpen(false);
      return;
    }
    onChangeMany([...selectedMany, option]);
    setQuery('');
    setOpen(false);
  };

  const removeMany = (option) => {
    if (!onChangeMany) return;
    const key = getOptionKey(option, type);
    onChangeMany(selectedMany.filter((item) => getOptionKey(item, type) !== key));
  };

  const handleKeyDown = (event) => {
    if (!open || options.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1 >= options.length ? 0 : prev + 1));
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => (prev - 1 < 0 ? options.length - 1 : prev - 1));
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const option = options[activeIndex] || options[0];
      if (!option) return;
      if (multiple) commitMany(option);
      else commitSingle(option);
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div className="location-autocomplete" ref={rootRef}>
      {label && <label className="form-label">{label}</label>}

      {multiple && selectedMany.length > 0 && (
        <div className="location-autocomplete__chips">
          {selectedMany.map((item) => (
            <button
              type="button"
              className="location-chip"
              key={getOptionKey(item, type)}
              onClick={() => removeMany(item)}
            >
              {displayOption(item)} <span aria-hidden>×</span>
            </button>
          ))}
        </div>
      )}

      <input
        className="form-control"
        placeholder={placeholder}
        value={query}
        required={required && !multiple && !value}
        disabled={disabled}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          if (!multiple && value) {
            onChange?.(null);
          }
        }}
      />

      {open && (query.trim().length > 0 || loading) && (
        <div className="location-autocomplete__menu" role="listbox">
          {loading && <div className="location-autocomplete__item">Buscando...</div>}
          {!loading && options.length === 0 && (
            <div className="location-autocomplete__item text-muted">Sin coincidencias</div>
          )}
          {!loading && options.map((option, index) => (
            <button
              key={getOptionKey(option, type)}
              type="button"
              className={`location-autocomplete__item ${activeIndex === index ? 'is-active' : ''}`}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => (multiple ? commitMany(option) : commitSingle(option))}
            >
              {displayOption(option)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
