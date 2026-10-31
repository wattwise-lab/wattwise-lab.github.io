/* Exact rational arithmetic for the pocket calculator; no expression eval. */
var CMKeypad = (() => {
  'use strict';
  const gcd = (a, b) => {
    a = a < 0n ? -a : a;
    b = b < 0n ? -b : b;
    while (b) [a, b] = [b, a % b];
    return a || 1n;
  };
  class Decimal {
    constructor(n, d = 1n) {
      if (d === 0n) throw Error('division');
      if (d < 0n) {
        n = -n;
        d = -d;
      }
      const g = gcd(n, d);
      this.n = n / g;
      this.d = d / g;
    }
    static from(value) {
      const s = String(value);
      if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(s)) throw Error('number');
      const [m, e = '0'] = s.toLowerCase().split('e'),
        places = (m.split('.')[1] || '').length - Number(e);
      if (Math.abs(places) > 310) throw Error('overflow');
      let n = BigInt(m.replace('.', '')),
        d = 1n;
      if (places > 0) d = 10n ** BigInt(places);
      else n *= 10n ** BigInt(-places);
      return new Decimal(n, d);
    }
    add(v) {
      return new Decimal(this.n * v.d + v.n * this.d, this.d * v.d);
    }
    sub(v) {
      return new Decimal(this.n * v.d - v.n * this.d, this.d * v.d);
    }
    mul(v) {
      return new Decimal(this.n * v.n, this.d * v.d);
    }
    div(v) {
      return new Decimal(this.n * v.d, this.d * v.n);
    }
    neg() {
      return new Decimal(-this.n, this.d);
    }
    value() {
      const x = Number(this.n) / Number(this.d);
      if (!Number.isFinite(x) || Math.abs(x) > 1e100) throw Error('overflow');
      return x;
    }
    display() {
      return Number(this.value().toPrecision(15)).toString();
    }
  }
  const apply = (a, op, b) =>
    op === '+' ? a.add(b) : op === '-' ? a.sub(b) : op === '*' ? a.mul(b) : a.div(b);
  class Pocket {
    constructor() {
      this.memory = Decimal.from('0');
      this.history = [];
      this.clear();
    }
    snapshot() {
      const decimal = (v) => (v ? { n: String(v.n), d: String(v.d) } : null);
      return {
        version: 1,
        entry: this.entry,
        acc: decimal(this.acc),
        op: this.op,
        lastOp: this.lastOp,
        lastOperand: decimal(this.lastOperand),
        memory: decimal(this.memory),
        replace: this.replace,
        expression: this.expression,
        error: this.error,
        history: this.history.map((x) => ({ ...x })),
      };
    }
    restore(state) {
      if (
        state?.version !== 1 ||
        typeof state.entry !== 'string' ||
        !Array.isArray(state.history) ||
        state.history.length > 20
      )
        throw Error('state');
      Decimal.from(state.entry);
      const decimal = (value) =>
          value === null ? null : new Decimal(BigInt(value.n), BigInt(value.d)),
        acc = decimal(state.acc),
        lastOperand = decimal(state.lastOperand),
        memory = decimal(state.memory);
      if (
        !memory ||
        ![null, '+', '-', '*', '/'].includes(state.op) ||
        ![null, '+', '-', '*', '/'].includes(state.lastOp)
      )
        throw Error('state');
      this.entry = state.entry;
      this.acc = acc;
      this.lastOperand = lastOperand;
      this.memory = memory;
      this.op = state.op;
      this.lastOp = state.lastOp;
      this.replace = Boolean(state.replace);
      this.expression = String(state.expression);
      this.error = state.error;
      this.history = state.history.map((x) => ({ ...x }));
    }
    clear() {
      this.entry = '0';
      this.acc = null;
      this.op = null;
      this.lastOp = null;
      this.lastOperand = null;
      this.replace = true;
      this.expression = '';
      this.error = null;
    }
    input(key) {
      try {
        if (key === 'AC') {
          this.clear();
          return;
        }
        if (this.error) {
          this.clear();
          if (!/^[0-9.]$/.test(key)) return;
        }
        if (/^[0-9.]$/.test(key)) {
          if (this.replace) {
            if (!this.op) this.expression = '';
            this.entry = key === '.' ? '0.' : key;
            this.replace = false;
          } else if (key === '.' && !this.entry.includes('.')) this.entry += '.';
          else if (key !== '.' && this.entry.replace(/[-.]/g, '').length < 15)
            this.entry =
              this.entry === '0' ? key : this.entry === '-0' ? '-' + key : this.entry + key;
          return;
        }
        if (key === 'CE') {
          this.entry = '0';
          this.replace = false;
          return;
        }
        if (key === 'back') {
          if (!this.replace) this.entry = this.entry.slice(0, -1);
          if (!this.entry || this.entry === '-') this.entry = '0';
          return;
        }
        if (key === 'sign') {
          this.entry = this.entry.startsWith('-') ? this.entry.slice(1) : '-' + this.entry;
          this.replace = false;
          return;
        }
        if (key === 'MC') {
          this.memory = Decimal.from('0');
          return;
        }
        if (key === 'MR') {
          this.entry = this.memory.display();
          this.replace = true;
          return;
        }
        let value = Decimal.from(this.entry);
        if (key === 'M+' || key === 'M-') {
          this.memory = key === 'M+' ? this.memory.add(value) : this.memory.sub(value);
          return;
        }
        if (key === '%') {
          value =
            this.acc && ['+', '-'].includes(this.op)
              ? this.acc.mul(value).div(Decimal.from(100))
              : value.div(Decimal.from(100));
          this.entry = value.display();
          return;
        }
        if (key === 'sqrt') {
          if (value.n < 0n) throw Error('domain');
          this.entry = Decimal.from(Math.sqrt(value.value())).display();
          this.replace = true;
          return;
        }
        if (key === 'reciprocal') {
          this.entry = Decimal.from(1).div(value).display();
          this.replace = true;
          return;
        }
        if (['+', '-', '*', '/'].includes(key)) {
          if (this.op && !this.replace) {
            this.acc = apply(this.acc, this.op, value);
            this.entry = this.acc.display();
          } else if (!this.op) this.acc = value;
          this.op = key;
          this.expression = this.acc.display() + ' ' + key;
          this.replace = true;
          this.lastOp = null;
          return;
        }
        if (key === '=') {
          const operation = this.op || this.lastOp;
          if (!operation) return;
          const right = this.op ? value : this.lastOperand,
            left = this.op ? this.acc : value;
          const result = apply(left, operation, right);
          this.expression = left.display() + ' ' + operation + ' ' + right.display() + ' =';
          this.entry = result.display();
          this.history.unshift({ expression: this.expression, result: this.entry });
          this.history = this.history.slice(0, 20);
          this.lastOp = operation;
          this.lastOperand = right;
          this.acc = null;
          this.op = null;
          this.replace = true;
        }
      } catch (e) {
        this.error = e.message;
        this.entry = '0';
        this.replace = true;
      }
    }
  }
  function scientific(source, degrees = true, ans = 0) {
    const input = String(source)
      .replace(/[×]/g, '*')
      .replace(/[÷]/g, '/')
      .replace(/[−]/g, '-')
      .replace(/π/g, 'pi');
    if (input.length > 500) throw Error('length');
    const tokens =
      input.match(/(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?|[a-zA-Z]+|[+\-*/^()%!,]/g) || [];
    if (tokens.join('') !== input.replace(/\s/g, '')) throw Error('syntax');
    let pos = 0,
      depth = 0;
    const finite = (x) => {
      if (!Number.isFinite(x) || Math.abs(x) > 1e100) throw Error('domain');
      return x;
    };
    const factorial = (x) => {
      if (!Number.isInteger(x) || x < 0 || x > 69) throw Error('domain');
      let r = 1;
      for (let k = 2; k <= x; k++) r *= k;
      return r;
    };
    const trig = (x) => (degrees ? (x * Math.PI) / 180 : x),
      inv = (x) => (degrees ? (x * 180) / Math.PI : x);
    const quarter = (x) => (degrees ? x / 90 : x / (Math.PI / 2)),
      qindex = (q) => ((q % 4) + 4) % 4;
    const funcs = {
      sin: (x) =>
        Number.isInteger(quarter(x)) ? [0, 1, 0, -1][qindex(quarter(x))] : Math.sin(trig(x)),
      cos: (x) =>
        Number.isInteger(quarter(x)) ? [1, 0, -1, 0][qindex(quarter(x))] : Math.cos(trig(x)),
      tan: (x) => {
        const q = quarter(x);
        if (Number.isInteger(q) && Math.abs(q % 2) === 1) throw Error('domain');
        return Number.isInteger(q) ? 0 : Math.tan(trig(x));
      },
      asin: (x) => inv(Math.asin(x)),
      acos: (x) => inv(Math.acos(x)),
      atan: (x) => inv(Math.atan(x)),
      sqrt: Math.sqrt,
      cbrt: Math.cbrt,
      ln: Math.log,
      log: Math.log10,
      exp: Math.exp,
      abs: Math.abs,
    };
    function atom() {
      if (++depth > 60) throw Error('length');
      let t = tokens[pos++],
        v;
      if (t === '(') {
        v = expression();
        if (tokens[pos++] !== ')') throw Error('syntax');
      } else if (t === 'pi') v = Math.PI;
      else if (t === 'e') v = Math.E;
      else if (t === 'Ans' || t === 'ans') v = ans;
      else if (Object.hasOwn(funcs, t)) {
        if (tokens[pos++] !== '(') throw Error('syntax');
        const a = expression();
        if (tokens[pos++] !== ')') throw Error('syntax');
        v = funcs[t](a);
      } else if (t && /^(?:\d|\.)/.test(t)) v = Number(t);
      else throw Error('syntax');
      while (tokens[pos] === '!' || tokens[pos] === '%') {
        v = tokens[pos++] === '!' ? factorial(v) : v / 100;
      }
      depth--;
      return finite(v);
    }
    function power() {
      let a = atom();
      if (tokens[pos] === '^') {
        pos++;
        const exponent = unary();
        if (a === 0 && exponent <= 0) throw Error('domain');
        a = finite(a ** exponent);
      }
      return a;
    }
    function unary() {
      if (tokens[pos] === '+') {
        pos++;
        return unary();
      }
      if (tokens[pos] === '-') {
        pos++;
        return -unary();
      }
      return power();
    }
    function product() {
      let a = unary();
      while (true) {
        const t = tokens[pos],
          implicit =
            t === '(' ||
            t === 'pi' ||
            t === 'e' ||
            t === 'Ans' ||
            t === 'ans' ||
            Object.hasOwn(funcs, t || '');
        if (t === '*' || t === '/') {
          pos++;
          const b = unary();
          if (t === '/' && b === 0) throw Error('division');
          a = finite(t === '*' ? a * b : a / b);
        } else if (implicit) a = finite(a * unary());
        else break;
      }
      return a;
    }
    function expression() {
      let a = product();
      while (tokens[pos] === '+' || tokens[pos] === '-') {
        const t = tokens[pos++],
          b = product();
        a = finite(t === '+' ? a + b : a - b);
      }
      return a;
    }
    if (!tokens.length) return 0;
    const result = expression();
    if (pos !== tokens.length) throw Error('syntax');
    return finite(result);
  }
  return { Decimal, Pocket, scientific };
})();
