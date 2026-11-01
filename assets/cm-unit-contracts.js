var CMUnits = (() => {
  "use strict";
  const rows = {};
  const add = (names, dimension, scale = 1, offset = 0) => names.split("|").forEach((name) => rows[name] = { dimension, scale, offset });
  add("m|meter|meters|metre|metres", "length");
  add("km", "length", 1e3);
  add("cm", "length", 0.01);
  add("mm", "length", 1e-3);
  add("in|inch|inches", "length", 0.0254);
  add("ft|foot|feet", "length", 0.3048);
  add("yd", "length", 0.9144);
  add("mi", "length", 1609.344);
  add("m\xB2|m2", "area");
  add("cm\xB2|cm2", "area", 1e-4);
  add("ft\xB2|ft2", "area", 0.09290304);
  add("acre|acres", "area", 4046.8564224);
  add("ha", "area", 1e4);
  add("m\xB3|m3", "volume");
  add("L|liters|litres", "volume", 1e-3);
  add("mL", "volume", 1e-6);
  add("ft\xB3|ft3", "volume", 0.028316846592);
  add("kg", "mass");
  add("g", "mass", 1e-3);
  add("mg", "mass", 1e-6);
  add("lb|lbs", "mass", 0.45359237);
  add("s|second|seconds", "duration");
  add("min|minute|minutes", "duration", 60);
  add("h|hour|hours", "duration", 3600);
  add("day|days", "duration", 86400);
  add("week|weeks", "duration", 604800);
  add("month|months", "calendar-month");
  add("year|years", "calendar-month", 12);
  add("m/s", "speed");
  add("km/h", "speed", 1 / 3.6);
  add("mph", "speed", 0.44704);
  add("ft/s", "speed", 0.3048);
  add("K", "temperature");
  add("\xB0C|Celsius", "temperature", 1, 273.15);
  add("\xB0F|Fahrenheit", "temperature", 5 / 9, 255.3722222222222);
  add("Pa", "pressure");
  add("kPa", "pressure", 1e3);
  add("MPa", "pressure", 1e6);
  add("bar", "pressure", 1e5);
  add("psi", "pressure", 6894.757293168);
  add("J", "energy");
  add("kJ", "energy", 1e3);
  add("Wh", "energy", 3600);
  add("kWh", "energy", 36e5);
  add("W", "power");
  add("kW", "power", 1e3);
  add("%|percent", "percentage");
  add("ratio|fraction|dimensionless", "ratio");
  for (const currency of ["USD", "EUR", "GBP", "CNY", "JPY"]) {
    add(currency, "currency:" + currency);
    for (const [span, d] of [
      ["month", "month"],
      ["year", "year"],
      ["hour", "hour"],
      ["call", "call"]
    ])
      add(currency + "/" + span, "currency:" + currency + "/" + d);
  }
  add("USD/month", "currency:USD/calendar-rate");
  add("USD/year", "currency:USD/calendar-rate", 1 / 12);
  add("calls/month", "calls/calendar-rate");
  add("calls/year", "calls/calendar-rate", 1 / 12);
  add("tokens/call", "tokens/call");
  function normalize(unit) {
    return String(unit ?? "").trim().replace(/\s+/g, " ").replaceAll("\u2212", "-");
  }
  function contract(from, to) {
    const a = rows[normalize(from)], b = rows[normalize(to)];
    if (!a || !b) return { state: "unknown" };
    if (a.dimension !== b.dimension) return { state: "incompatible" };
    return {
      state: "compatible",
      factor: a.scale / b.scale,
      offset: (a.offset - b.offset) / b.scale
    };
  }
  function convert(value, from, to) {
    if (!Number.isFinite(value)) return null;
    const c = contract(from, to);
    if (c.state !== "compatible") return null;
    const result = value * c.factor + c.offset;
    return Number.isFinite(result) ? result : null;
  }
  return { contract, convert, normalize };
})();
