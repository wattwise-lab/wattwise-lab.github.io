/* Explicit, non-sensitive enum preferences only. Never store calculator inputs. */
window.CMPreferenceStore = (() => {
  'use strict';
  const key = 'calcmintly-preferences-v1';
  const policies = {
    'bmi-calculator': {
      unit: ['us', 'metric'],
    },
    'unit-converter': {
      from: ['m', 'km', 'cm', 'mm', 'in', 'ft', 'mi'],
      to: ['m', 'km', 'cm', 'mm', 'in', 'ft', 'mi'],
    },
    'temperature-converter': {
      from: ['c', 'f', 'k'],
      to: ['c', 'f', 'k'],
    },
    'weight-converter': {
      from: ['kg', 'g', 'lb', 'oz'],
      to: ['kg', 'g', 'lb', 'oz'],
    },
    'area-converter': {
      from: ['sqm', 'sqft', 'acre', 'mu'],
      to: ['sqm', 'sqft', 'acre', 'mu'],
    },
    'volume-converter': {
      from: ['l', 'ml', 'm3', 'gal'],
      to: ['l', 'ml', 'm3', 'gal'],
    },
    'merchant-profit-planner': {
      currency: ['USD', 'JPY', 'TWD', 'EUR'],
    },
    'data-storage-converter': {
      from: ['B', 'KB', 'MB', 'GB', 'TB'],
      to: ['B', 'KB', 'MB', 'GB', 'TB'],
      base: ['1024', '1000'],
    },
    'speed-converter': {
      from: ['km/h', 'm/s', 'mph', 'knot'],
      to: ['km/h', 'm/s', 'mph', 'knot'],
    },
    'timezone-converter': {
      from: [
        '-12',
        '-11',
        '-10',
        '-9',
        '-8',
        '-7',
        '-6',
        '-5',
        '-4',
        '-3',
        '-2',
        '-1',
        '0',
        '1',
        '2',
        '3',
        '4',
        '5',
        '5.5',
        '6',
        '7',
        '8',
        '9',
        '9.5',
        '10',
        '11',
        '12',
        '13',
        '14',
      ],
      to: [
        '-12',
        '-11',
        '-10',
        '-9',
        '-8',
        '-7',
        '-6',
        '-5',
        '-4',
        '-3',
        '-2',
        '-1',
        '0',
        '1',
        '2',
        '3',
        '4',
        '5',
        '5.5',
        '6',
        '7',
        '8',
        '9',
        '9.5',
        '10',
        '11',
        '12',
        '13',
        '14',
      ],
    },
    'pressure-converter': {
      a: ['Pa', 'kPa', 'MPa', 'bar', 'atm', 'psi', 'Torr'],
      b: ['Pa', 'kPa', 'MPa', 'bar', 'atm', 'psi', 'Torr'],
    },
    'energy-converter': {
      a: ['J', 'kJ', 'MJ', 'Wh', 'kWh', 'cal-th', 'kcal-th', 'eV'],
      b: ['J', 'kJ', 'MJ', 'Wh', 'kWh', 'cal-th', 'kcal-th', 'eV'],
    },
    'power-converter': {
      a: ['W', 'kW', 'MW', 'hp-mech', 'PS'],
      b: ['W', 'kW', 'MW', 'hp-mech', 'PS'],
    },
    'force-converter': {
      a: ['N', 'kN', 'dyn', 'lbf', 'kgf'],
      b: ['N', 'kN', 'dyn', 'lbf', 'kgf'],
    },
    'angle-converter': {
      a: ['rad', 'deg', 'turn', 'grad', 'arcmin', 'arcsec'],
      b: ['rad', 'deg', 'turn', 'grad', 'arcmin', 'arcsec'],
    },
    'frequency-converter': {
      a: ['Hz', 'kHz', 'MHz', 'GHz', 'rpm'],
      b: ['Hz', 'kHz', 'MHz', 'GHz', 'rpm'],
    },
    'electric-charge-converter': {
      a: ['C', 'mC', 'µC', 'nC', 'Ah', 'mAh', 'e'],
      b: ['C', 'mC', 'µC', 'nC', 'Ah', 'mAh', 'e'],
    },
    'voltage-converter': {
      a: ['V', 'mV', 'µV', 'kV', 'MV'],
      b: ['V', 'mV', 'µV', 'kV', 'MV'],
    },
    'electric-current-converter': {
      a: ['A', 'mA', 'µA', 'nA', 'kA'],
      b: ['A', 'mA', 'µA', 'nA', 'kA'],
    },
    'resistance-converter': {
      a: ['Ω', 'mΩ', 'µΩ', 'kΩ', 'MΩ', 'GΩ'],
      b: ['Ω', 'mΩ', 'µΩ', 'kΩ', 'MΩ', 'GΩ'],
    },
    'capacitance-converter': {
      a: ['F', 'mF', 'µF', 'nF', 'pF'],
      b: ['F', 'mF', 'µF', 'nF', 'pF'],
    },
    'inductance-converter': {
      a: ['H', 'mH', 'µH', 'nH'],
      b: ['H', 'mH', 'µH', 'nH'],
    },
    'density-converter': {
      a: ['kg/m³', 'g/cm³', 'g/mL', 'kg/L', 'lb/ft³', 'lb/US-gal'],
      b: ['kg/m³', 'g/cm³', 'g/mL', 'kg/L', 'lb/ft³', 'lb/US-gal'],
    },
    'volume-flow-converter': {
      a: ['m³/s', 'm³/h', 'L/s', 'L/min', 'US-gal/min', 'imp-gal/min', 'ft³/min'],
      b: ['m³/s', 'm³/h', 'L/s', 'L/min', 'US-gal/min', 'imp-gal/min', 'ft³/min'],
    },
    'torque-converter': {
      a: ['N·m', 'N·cm', 'lbf·ft', 'lbf·in', 'kgf·m'],
      b: ['N·m', 'N·cm', 'lbf·ft', 'lbf·in', 'kgf·m'],
    },
    'acceleration-converter': {
      a: ['m/s²', 'ft/s²', 'g0', 'Gal'],
      b: ['m/s²', 'ft/s²', 'g0', 'Gal'],
    },
    'dynamic-viscosity-converter': {
      a: ['Pa·s', 'mPa·s', 'P', 'cP'],
      b: ['Pa·s', 'mPa·s', 'P', 'cP'],
    },
    'kinematic-viscosity-converter': {
      a: ['m²/s', 'mm²/s', 'St', 'cSt'],
      b: ['m²/s', 'mm²/s', 'St', 'cSt'],
    },
    'thermal-conductivity-converter': {
      a: ['W/(m·K)', 'mW/(m·K)', 'W/(cm·K)', 'cal-th/(s·cm·K)'],
      b: ['W/(m·K)', 'mW/(m·K)', 'W/(cm·K)', 'cal-th/(s·cm·K)'],
    },
    'heat-flux-converter': {
      a: ['W/m²', 'kW/m²', 'W/cm²', 'W/ft²'],
      b: ['W/m²', 'kW/m²', 'W/cm²', 'W/ft²'],
    },
    'illuminance-converter': {
      a: ['lx', 'fc', 'ph'],
      b: ['lx', 'fc', 'ph'],
    },
    'radioactivity-converter': {
      a: ['Bq', 'kBq', 'MBq', 'GBq', 'Ci', 'mCi', 'µCi'],
      b: ['Bq', 'kBq', 'MBq', 'GBq', 'Ci', 'mCi', 'µCi'],
    },
    'absorbed-dose-converter': {
      a: ['Gy', 'mGy', 'µGy', 'rad'],
      b: ['Gy', 'mGy', 'µGy', 'rad'],
    },
  };
  const toolLimit = Object.keys(policies).length;
  const empty = () => ({ version: 1, tools: {} });
  function choices(slug, source) {
    const policy = Object.hasOwn(policies, slug) && policies[slug];
    if (!policy || !source || typeof source !== 'object' || Array.isArray(source)) return null;
    const clean = {};
    for (const [id, allowed] of Object.entries(policy)) {
      if (!Object.hasOwn(source, id) || !allowed.includes(source[id])) return null;
      clean[id] = source[id];
    }
    return clean;
  }
  function sanitize(source) {
    if (
      !source ||
      source.version !== 1 ||
      !source.tools ||
      typeof source.tools !== 'object' ||
      Array.isArray(source.tools)
    )
      return empty();
    const entries = Object.entries(source.tools);
    if (entries.length > toolLimit) return empty();
    const clean = empty();
    for (const [slug, values] of entries) {
      const allowed = choices(slug, values);
      if (allowed) clean.tools[slug] = allowed;
    }
    return clean;
  }
  function read(storage) {
    try {
      const raw = storage.getItem(key);
      return typeof raw === 'string' && raw.length <= 12288 ? sanitize(JSON.parse(raw)) : empty();
    } catch {
      return empty();
    }
  }
  function remember(storage, slug, values) {
    const clean = choices(slug, values);
    if (!clean) return false;
    try {
      const saved = read(storage);
      saved.tools[slug] = clean;
      storage.setItem(key, JSON.stringify(saved));
      return true;
    } catch {
      return false;
    }
  }
  function forget(storage, slug) {
    if (!Object.hasOwn(policies, slug)) return false;
    try {
      const saved = read(storage);
      delete saved.tools[slug];
      if (Object.keys(saved.tools).length) storage.setItem(key, JSON.stringify(saved));
      else storage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }
  function mayRestore({ embedded = false, hash = '', search = '', changed = false } = {}) {
    if (embedded || hash || changed) return false;
    try {
      return [...new URLSearchParams(search).keys()].every((name) => name === 'lang');
    } catch {
      return false;
    }
  }
  return { key, policies, toolLimit, choices, sanitize, read, remember, forget, mayRestore };
})();
