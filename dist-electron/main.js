var Ti = Object.defineProperty;
var Bs = (e) => {
  throw TypeError(e);
};
var ji = (e, t, r) => t in e ? Ti(e, t, { enumerable: !0, configurable: !0, writable: !0, value: r }) : e[t] = r;
var Dt = (e, t, r) => ji(e, typeof t != "symbol" ? t + "" : t, r), sn = (e, t, r) => t.has(e) || Bs("Cannot " + r);
var q = (e, t, r) => (sn(e, t, "read from private field"), r ? r.call(e) : t.get(e)), ke = (e, t, r) => t.has(e) ? Bs("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(e) : t.set(e, r), ve = (e, t, r, n) => (sn(e, t, "write to private field"), n ? n.call(e, r) : t.set(e, r), r), ze = (e, t, r) => (sn(e, t, "access private method"), r);
import eo, { ipcMain as pt, app as gr, BrowserWindow as to } from "electron";
import { createRequire as Ai } from "node:module";
import { fileURLToPath as ki } from "node:url";
import X from "node:path";
import ne from "node:process";
import { promisify as le, isDeepStrictEqual as xs } from "node:util";
import G from "node:fs";
import st from "node:crypto";
import Js from "node:assert";
import Pr from "node:os";
const ft = (e) => {
  const t = typeof e;
  return e !== null && (t === "object" || t === "function");
}, ro = /* @__PURE__ */ new Set([
  "__proto__",
  "prototype",
  "constructor"
]), no = 1e6, Ci = (e) => e >= "0" && e <= "9";
function so(e) {
  if (e === "0")
    return !0;
  if (/^[1-9]\d*$/.test(e)) {
    const t = Number.parseInt(e, 10);
    return t <= Number.MAX_SAFE_INTEGER && t <= no;
  }
  return !1;
}
function an(e, t) {
  return ro.has(e) ? !1 : (e && so(e) ? t.push(Number.parseInt(e, 10)) : t.push(e), !0);
}
function Di(e) {
  if (typeof e != "string")
    throw new TypeError(`Expected a string, got ${typeof e}`);
  const t = [];
  let r = "", n = "start", s = !1, a = 0;
  for (const o of e) {
    if (a++, s) {
      r += o, s = !1;
      continue;
    }
    if (o === "\\") {
      if (n === "index")
        throw new Error(`Invalid character '${o}' in an index at position ${a}`);
      if (n === "indexEnd")
        throw new Error(`Invalid character '${o}' after an index at position ${a}`);
      s = !0, n = n === "start" ? "property" : n;
      continue;
    }
    switch (o) {
      case ".": {
        if (n === "index")
          throw new Error(`Invalid character '${o}' in an index at position ${a}`);
        if (n === "indexEnd") {
          n = "property";
          break;
        }
        if (!an(r, t))
          return [];
        r = "", n = "property";
        break;
      }
      case "[": {
        if (n === "index")
          throw new Error(`Invalid character '${o}' in an index at position ${a}`);
        if (n === "indexEnd") {
          n = "index";
          break;
        }
        if (n === "property" || n === "start") {
          if ((r || n === "property") && !an(r, t))
            return [];
          r = "";
        }
        n = "index";
        break;
      }
      case "]": {
        if (n === "index") {
          if (r === "")
            r = (t.pop() || "") + "[]", n = "property";
          else {
            const l = Number.parseInt(r, 10);
            !Number.isNaN(l) && Number.isFinite(l) && l >= 0 && l <= Number.MAX_SAFE_INTEGER && l <= no && r === String(l) ? t.push(l) : t.push(r), r = "", n = "indexEnd";
          }
          break;
        }
        if (n === "indexEnd")
          throw new Error(`Invalid character '${o}' after an index at position ${a}`);
        r += o;
        break;
      }
      default: {
        if (n === "index" && !Ci(o))
          throw new Error(`Invalid character '${o}' in an index at position ${a}`);
        if (n === "indexEnd")
          throw new Error(`Invalid character '${o}' after an index at position ${a}`);
        n === "start" && (n = "property"), r += o;
      }
    }
  }
  switch (s && (r += "\\"), n) {
    case "property": {
      if (!an(r, t))
        return [];
      break;
    }
    case "index":
      throw new Error("Index was not closed");
    case "start": {
      t.push("");
      break;
    }
  }
  return t;
}
function Rr(e) {
  if (typeof e == "string")
    return Di(e);
  if (Array.isArray(e)) {
    const t = [];
    for (const [r, n] of e.entries()) {
      if (typeof n != "string" && typeof n != "number")
        throw new TypeError(`Expected a string or number for path segment at index ${r}, got ${typeof n}`);
      if (typeof n == "number" && !Number.isFinite(n))
        throw new TypeError(`Path segment at index ${r} must be a finite number, got ${n}`);
      if (ro.has(n))
        return [];
      typeof n == "string" && so(n) ? t.push(Number.parseInt(n, 10)) : t.push(n);
    }
    return t;
  }
  return [];
}
function Ys(e, t, r) {
  if (!ft(e) || typeof t != "string" && !Array.isArray(t))
    return r === void 0 ? e : r;
  const n = Rr(t);
  if (n.length === 0)
    return r;
  for (let s = 0; s < n.length; s++) {
    const a = n[s];
    if (e = e[a], e == null) {
      if (s !== n.length - 1)
        return r;
      break;
    }
  }
  return e === void 0 ? r : e;
}
function Jt(e, t, r) {
  if (!ft(e) || typeof t != "string" && !Array.isArray(t))
    return e;
  const n = e, s = Rr(t);
  if (s.length === 0)
    return e;
  for (let a = 0; a < s.length; a++) {
    const o = s[a];
    if (a === s.length - 1)
      e[o] = r;
    else if (!ft(e[o])) {
      const i = typeof s[a + 1] == "number";
      e[o] = i ? [] : {};
    }
    e = e[o];
  }
  return n;
}
function Li(e, t) {
  if (!ft(e) || typeof t != "string" && !Array.isArray(t))
    return !1;
  const r = Rr(t);
  if (r.length === 0)
    return !1;
  for (let n = 0; n < r.length; n++) {
    const s = r[n];
    if (n === r.length - 1)
      return Object.hasOwn(e, s) ? (delete e[s], !0) : !1;
    if (e = e[s], !ft(e))
      return !1;
  }
}
function on(e, t) {
  if (!ft(e) || typeof t != "string" && !Array.isArray(t))
    return !1;
  const r = Rr(t);
  if (r.length === 0)
    return !1;
  for (const n of r) {
    if (!ft(e) || !(n in e))
      return !1;
    e = e[n];
  }
  return !0;
}
const et = Pr.homedir(), Vn = Pr.tmpdir(), { env: St } = ne, Mi = (e) => {
  const t = X.join(et, "Library");
  return {
    data: X.join(t, "Application Support", e),
    config: X.join(t, "Preferences", e),
    cache: X.join(t, "Caches", e),
    log: X.join(t, "Logs", e),
    temp: X.join(Vn, e)
  };
}, Vi = (e) => {
  const t = St.APPDATA || X.join(et, "AppData", "Roaming"), r = St.LOCALAPPDATA || X.join(et, "AppData", "Local");
  return {
    // Data/config/cache/log are invented by me as Windows isn't opinionated about this
    data: X.join(r, e, "Data"),
    config: X.join(t, e, "Config"),
    cache: X.join(r, e, "Cache"),
    log: X.join(r, e, "Log"),
    temp: X.join(Vn, e)
  };
}, zi = (e) => {
  const t = X.basename(et);
  return {
    data: X.join(St.XDG_DATA_HOME || X.join(et, ".local", "share"), e),
    config: X.join(St.XDG_CONFIG_HOME || X.join(et, ".config"), e),
    cache: X.join(St.XDG_CACHE_HOME || X.join(et, ".cache"), e),
    // https://wiki.debian.org/XDGBaseDirectorySpecification#state
    log: X.join(St.XDG_STATE_HOME || X.join(et, ".local", "state"), e),
    temp: X.join(Vn, t, e)
  };
};
function Fi(e, { suffix: t = "nodejs" } = {}) {
  if (typeof e != "string")
    throw new TypeError(`Expected a string, got ${typeof e}`);
  return t && (e += `-${t}`), ne.platform === "darwin" ? Mi(e) : ne.platform === "win32" ? Vi(e) : zi(e);
}
const He = (e, t) => function(...n) {
  return e.apply(void 0, n).catch(t);
}, Fe = (e, t) => function(...n) {
  try {
    return e.apply(void 0, n);
  } catch (s) {
    return t(s);
  }
}, Ui = ne.getuid ? !ne.getuid() : !1, qi = 1e4, _e = () => {
}, ee = {
  /* API */
  isChangeErrorOk: (e) => {
    if (!ee.isNodeError(e))
      return !1;
    const { code: t } = e;
    return t === "ENOSYS" || !Ui && (t === "EINVAL" || t === "EPERM");
  },
  isNodeError: (e) => e instanceof Error,
  isRetriableError: (e) => {
    if (!ee.isNodeError(e))
      return !1;
    const { code: t } = e;
    return t === "EMFILE" || t === "ENFILE" || t === "EAGAIN" || t === "EBUSY" || t === "EACCESS" || t === "EACCES" || t === "EACCS" || t === "EPERM";
  },
  onChangeError: (e) => {
    if (!ee.isNodeError(e))
      throw e;
    if (!ee.isChangeErrorOk(e))
      throw e;
  }
};
class Gi {
  constructor() {
    this.interval = 25, this.intervalId = void 0, this.limit = qi, this.queueActive = /* @__PURE__ */ new Set(), this.queueWaiting = /* @__PURE__ */ new Set(), this.init = () => {
      this.intervalId || (this.intervalId = setInterval(this.tick, this.interval));
    }, this.reset = () => {
      this.intervalId && (clearInterval(this.intervalId), delete this.intervalId);
    }, this.add = (t) => {
      this.queueWaiting.add(t), this.queueActive.size < this.limit / 2 ? this.tick() : this.init();
    }, this.remove = (t) => {
      this.queueWaiting.delete(t), this.queueActive.delete(t);
    }, this.schedule = () => new Promise((t) => {
      const r = () => this.remove(n), n = () => t(r);
      this.add(n);
    }), this.tick = () => {
      if (!(this.queueActive.size >= this.limit)) {
        if (!this.queueWaiting.size)
          return this.reset();
        for (const t of this.queueWaiting) {
          if (this.queueActive.size >= this.limit)
            break;
          this.queueWaiting.delete(t), this.queueActive.add(t), t();
        }
      }
    };
  }
}
const Ki = new Gi(), Xe = (e, t) => function(n) {
  return function s(...a) {
    return Ki.schedule().then((o) => {
      const l = (d) => (o(), d), i = (d) => {
        if (o(), Date.now() >= n)
          throw d;
        if (t(d)) {
          const c = Math.round(100 * Math.random());
          return new Promise((_) => setTimeout(_, c)).then(() => s.apply(void 0, a));
        }
        throw d;
      };
      return e.apply(void 0, a).then(l, i);
    });
  };
}, We = (e, t) => function(n) {
  return function s(...a) {
    try {
      return e.apply(void 0, a);
    } catch (o) {
      if (Date.now() > n)
        throw o;
      if (t(o))
        return s.apply(void 0, a);
      throw o;
    }
  };
}, de = {
  attempt: {
    /* ASYNC */
    chmod: He(le(G.chmod), ee.onChangeError),
    chown: He(le(G.chown), ee.onChangeError),
    close: He(le(G.close), _e),
    fsync: He(le(G.fsync), _e),
    mkdir: He(le(G.mkdir), _e),
    realpath: He(le(G.realpath), _e),
    stat: He(le(G.stat), _e),
    unlink: He(le(G.unlink), _e),
    /* SYNC */
    chmodSync: Fe(G.chmodSync, ee.onChangeError),
    chownSync: Fe(G.chownSync, ee.onChangeError),
    closeSync: Fe(G.closeSync, _e),
    existsSync: Fe(G.existsSync, _e),
    fsyncSync: Fe(G.fsync, _e),
    mkdirSync: Fe(G.mkdirSync, _e),
    realpathSync: Fe(G.realpathSync, _e),
    statSync: Fe(G.statSync, _e),
    unlinkSync: Fe(G.unlinkSync, _e)
  },
  retry: {
    /* ASYNC */
    close: Xe(le(G.close), ee.isRetriableError),
    fsync: Xe(le(G.fsync), ee.isRetriableError),
    open: Xe(le(G.open), ee.isRetriableError),
    readFile: Xe(le(G.readFile), ee.isRetriableError),
    rename: Xe(le(G.rename), ee.isRetriableError),
    stat: Xe(le(G.stat), ee.isRetriableError),
    write: Xe(le(G.write), ee.isRetriableError),
    writeFile: Xe(le(G.writeFile), ee.isRetriableError),
    /* SYNC */
    closeSync: We(G.closeSync, ee.isRetriableError),
    fsyncSync: We(G.fsyncSync, ee.isRetriableError),
    openSync: We(G.openSync, ee.isRetriableError),
    readFileSync: We(G.readFileSync, ee.isRetriableError),
    renameSync: We(G.renameSync, ee.isRetriableError),
    statSync: We(G.statSync, ee.isRetriableError),
    writeSync: We(G.writeSync, ee.isRetriableError),
    writeFileSync: We(G.writeFileSync, ee.isRetriableError)
  }
}, Hi = "utf8", Zs = 438, Xi = 511, Wi = {}, Bi = Pr.userInfo().uid, xi = Pr.userInfo().gid, Ji = 1e3, Yi = !!ne.getuid;
ne.getuid && ne.getuid();
const Qs = 128, Zi = (e) => e instanceof Error && "code" in e, ea = (e) => typeof e == "string", cn = (e) => e === void 0, Qi = ne.platform === "linux", ao = ne.platform === "win32", zn = ["SIGABRT", "SIGALRM", "SIGHUP", "SIGINT", "SIGTERM"];
ao || zn.push("SIGVTALRM", "SIGXCPU", "SIGXFSZ", "SIGUSR2", "SIGTRAP", "SIGSYS", "SIGQUIT", "SIGIOT");
Qi && zn.push("SIGIO", "SIGPOLL", "SIGPWR", "SIGSTKFLT", "SIGUNUSED");
class ec {
  /* CONSTRUCTOR */
  constructor() {
    this.callbacks = /* @__PURE__ */ new Set(), this.exited = !1, this.exit = (t) => {
      if (!this.exited) {
        this.exited = !0;
        for (const r of this.callbacks)
          r();
        t && (ao && t !== "SIGINT" && t !== "SIGTERM" && t !== "SIGKILL" ? ne.kill(ne.pid, "SIGTERM") : ne.kill(ne.pid, t));
      }
    }, this.hook = () => {
      ne.once("exit", () => this.exit());
      for (const t of zn)
        try {
          ne.once(t, () => this.exit(t));
        } catch {
        }
    }, this.register = (t) => (this.callbacks.add(t), () => {
      this.callbacks.delete(t);
    }), this.hook();
  }
}
const tc = new ec(), rc = tc.register, fe = {
  /* VARIABLES */
  store: {},
  /* API */
  create: (e) => {
    const t = `000000${Math.floor(Math.random() * 16777215).toString(16)}`.slice(-6), s = `.tmp-${Date.now().toString().slice(-10)}${t}`;
    return `${e}${s}`;
  },
  get: (e, t, r = !0) => {
    const n = fe.truncate(t(e));
    return n in fe.store ? fe.get(e, t, r) : (fe.store[n] = r, [n, () => delete fe.store[n]]);
  },
  purge: (e) => {
    fe.store[e] && (delete fe.store[e], de.attempt.unlink(e));
  },
  purgeSync: (e) => {
    fe.store[e] && (delete fe.store[e], de.attempt.unlinkSync(e));
  },
  purgeSyncAll: () => {
    for (const e in fe.store)
      fe.purgeSync(e);
  },
  truncate: (e) => {
    const t = X.basename(e);
    if (t.length <= Qs)
      return e;
    const r = /^(\.?)(.*?)((?:\.[^.]+)?(?:\.tmp-\d{10}[a-f0-9]{6})?)$/.exec(t);
    if (!r)
      return e;
    const n = t.length - Qs;
    return `${e.slice(0, -t.length)}${r[1]}${r[2].slice(0, -n)}${r[3]}`;
  }
};
rc(fe.purgeSyncAll);
function oo(e, t, r = Wi) {
  if (ea(r))
    return oo(e, t, { encoding: r });
  const n = Date.now() + ((r.timeout ?? Ji) || -1);
  let s = null, a = null, o = null;
  try {
    const l = de.attempt.realpathSync(e), i = !!l;
    e = l || e, [a, s] = fe.get(e, r.tmpCreate || fe.create, r.tmpPurge !== !1);
    const d = Yi && cn(r.chown), c = cn(r.mode);
    if (i && (d || c)) {
      const f = de.attempt.statSync(e);
      f && (r = { ...r }, d && (r.chown = { uid: f.uid, gid: f.gid }), c && (r.mode = f.mode));
    }
    if (!i) {
      const f = X.dirname(e);
      de.attempt.mkdirSync(f, {
        mode: Xi,
        recursive: !0
      });
    }
    o = de.retry.openSync(n)(a, "w", r.mode || Zs), r.tmpCreated && r.tmpCreated(a), ea(t) ? de.retry.writeSync(n)(o, t, 0, r.encoding || Hi) : cn(t) || de.retry.writeSync(n)(o, t, 0, t.length, 0), r.fsync !== !1 && (r.fsyncWait !== !1 ? de.retry.fsyncSync(n)(o) : de.attempt.fsync(o)), de.retry.closeSync(n)(o), o = null, r.chown && (r.chown.uid !== Bi || r.chown.gid !== xi) && de.attempt.chownSync(a, r.chown.uid, r.chown.gid), r.mode && r.mode !== Zs && de.attempt.chmodSync(a, r.mode);
    try {
      de.retry.renameSync(n)(a, e);
    } catch (f) {
      if (!Zi(f) || f.code !== "ENAMETOOLONG")
        throw f;
      de.retry.renameSync(n)(a, fe.truncate(e));
    }
    s(), a = null;
  } finally {
    o && de.attempt.closeSync(o), a && fe.purge(a);
  }
}
function io(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var Pn = { exports: {} }, Fn = {}, Pe = {}, It = {}, Wt = {}, U = {}, Xt = {};
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.regexpCode = e.getEsmExportName = e.getProperty = e.safeStringify = e.stringify = e.strConcat = e.addCodeArg = e.str = e._ = e.nil = e._Code = e.Name = e.IDENTIFIER = e._CodeOrName = void 0;
  class t {
  }
  e._CodeOrName = t, e.IDENTIFIER = /^[a-z$_][a-z$_0-9]*$/i;
  class r extends t {
    constructor(w) {
      if (super(), !e.IDENTIFIER.test(w))
        throw new Error("CodeGen: name must be a valid identifier");
      this.str = w;
    }
    toString() {
      return this.str;
    }
    emptyStr() {
      return !1;
    }
    get names() {
      return { [this.str]: 1 };
    }
  }
  e.Name = r;
  class n extends t {
    constructor(w) {
      super(), this._items = typeof w == "string" ? [w] : w;
    }
    toString() {
      return this.str;
    }
    emptyStr() {
      if (this._items.length > 1)
        return !1;
      const w = this._items[0];
      return w === "" || w === '""';
    }
    get str() {
      var w;
      return (w = this._str) !== null && w !== void 0 ? w : this._str = this._items.reduce((R, O) => `${R}${O}`, "");
    }
    get names() {
      var w;
      return (w = this._names) !== null && w !== void 0 ? w : this._names = this._items.reduce((R, O) => (O instanceof r && (R[O.str] = (R[O.str] || 0) + 1), R), {});
    }
  }
  e._Code = n, e.nil = new n("");
  function s(m, ...w) {
    const R = [m[0]];
    let O = 0;
    for (; O < w.length; )
      l(R, w[O]), R.push(m[++O]);
    return new n(R);
  }
  e._ = s;
  const a = new n("+");
  function o(m, ...w) {
    const R = [$(m[0])];
    let O = 0;
    for (; O < w.length; )
      R.push(a), l(R, w[O]), R.push(a, $(m[++O]));
    return i(R), new n(R);
  }
  e.str = o;
  function l(m, w) {
    w instanceof n ? m.push(...w._items) : w instanceof r ? m.push(w) : m.push(f(w));
  }
  e.addCodeArg = l;
  function i(m) {
    let w = 1;
    for (; w < m.length - 1; ) {
      if (m[w] === a) {
        const R = d(m[w - 1], m[w + 1]);
        if (R !== void 0) {
          m.splice(w - 1, 3, R);
          continue;
        }
        m[w++] = "+";
      }
      w++;
    }
  }
  function d(m, w) {
    if (w === '""')
      return m;
    if (m === '""')
      return w;
    if (typeof m == "string")
      return w instanceof r || m[m.length - 1] !== '"' ? void 0 : typeof w != "string" ? `${m.slice(0, -1)}${w}"` : w[0] === '"' ? m.slice(0, -1) + w.slice(1) : void 0;
    if (typeof w == "string" && w[0] === '"' && !(m instanceof r))
      return `"${m}${w.slice(1)}`;
  }
  function c(m, w) {
    return w.emptyStr() ? m : m.emptyStr() ? w : o`${m}${w}`;
  }
  e.strConcat = c;
  function f(m) {
    return typeof m == "number" || typeof m == "boolean" || m === null ? m : $(Array.isArray(m) ? m.join(",") : m);
  }
  function _(m) {
    return new n($(m));
  }
  e.stringify = _;
  function $(m) {
    return JSON.stringify(m).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
  }
  e.safeStringify = $;
  function E(m) {
    return typeof m == "string" && e.IDENTIFIER.test(m) ? new n(`.${m}`) : s`[${m}]`;
  }
  e.getProperty = E;
  function y(m) {
    if (typeof m == "string" && e.IDENTIFIER.test(m))
      return new n(`${m}`);
    throw new Error(`CodeGen: invalid export name: ${m}, use explicit $id name mapping`);
  }
  e.getEsmExportName = y;
  function v(m) {
    return new n(m.toString());
  }
  e.regexpCode = v;
})(Xt);
var Rn = {};
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.ValueScope = e.ValueScopeName = e.Scope = e.varKinds = e.UsedValueState = void 0;
  const t = Xt;
  class r extends Error {
    constructor(d) {
      super(`CodeGen: "code" for ${d} not defined`), this.value = d.value;
    }
  }
  var n;
  (function(i) {
    i[i.Started = 0] = "Started", i[i.Completed = 1] = "Completed";
  })(n || (e.UsedValueState = n = {})), e.varKinds = {
    const: new t.Name("const"),
    let: new t.Name("let"),
    var: new t.Name("var")
  };
  class s {
    constructor({ prefixes: d, parent: c } = {}) {
      this._names = {}, this._prefixes = d, this._parent = c;
    }
    toName(d) {
      return d instanceof t.Name ? d : this.name(d);
    }
    name(d) {
      return new t.Name(this._newName(d));
    }
    _newName(d) {
      const c = this._names[d] || this._nameGroup(d);
      return `${d}${c.index++}`;
    }
    _nameGroup(d) {
      var c, f;
      if (!((f = (c = this._parent) === null || c === void 0 ? void 0 : c._prefixes) === null || f === void 0) && f.has(d) || this._prefixes && !this._prefixes.has(d))
        throw new Error(`CodeGen: prefix "${d}" is not allowed in this scope`);
      return this._names[d] = { prefix: d, index: 0 };
    }
  }
  e.Scope = s;
  class a extends t.Name {
    constructor(d, c) {
      super(c), this.prefix = d;
    }
    setValue(d, { property: c, itemIndex: f }) {
      this.value = d, this.scopePath = (0, t._)`.${new t.Name(c)}[${f}]`;
    }
  }
  e.ValueScopeName = a;
  const o = (0, t._)`\n`;
  class l extends s {
    constructor(d) {
      super(d), this._values = {}, this._scope = d.scope, this.opts = { ...d, _n: d.lines ? o : t.nil };
    }
    get() {
      return this._scope;
    }
    name(d) {
      return new a(d, this._newName(d));
    }
    value(d, c) {
      var f;
      if (c.ref === void 0)
        throw new Error("CodeGen: ref must be passed in value");
      const _ = this.toName(d), { prefix: $ } = _, E = (f = c.key) !== null && f !== void 0 ? f : c.ref;
      let y = this._values[$];
      if (y) {
        const w = y.get(E);
        if (w)
          return w;
      } else
        y = this._values[$] = /* @__PURE__ */ new Map();
      y.set(E, _);
      const v = this._scope[$] || (this._scope[$] = []), m = v.length;
      return v[m] = c.ref, _.setValue(c, { property: $, itemIndex: m }), _;
    }
    getValue(d, c) {
      const f = this._values[d];
      if (f)
        return f.get(c);
    }
    scopeRefs(d, c = this._values) {
      return this._reduceValues(c, (f) => {
        if (f.scopePath === void 0)
          throw new Error(`CodeGen: name "${f}" has no value`);
        return (0, t._)`${d}${f.scopePath}`;
      });
    }
    scopeCode(d = this._values, c, f) {
      return this._reduceValues(d, (_) => {
        if (_.value === void 0)
          throw new Error(`CodeGen: name "${_}" has no value`);
        return _.value.code;
      }, c, f);
    }
    _reduceValues(d, c, f = {}, _) {
      let $ = t.nil;
      for (const E in d) {
        const y = d[E];
        if (!y)
          continue;
        const v = f[E] = f[E] || /* @__PURE__ */ new Map();
        y.forEach((m) => {
          if (v.has(m))
            return;
          v.set(m, n.Started);
          let w = c(m);
          if (w) {
            const R = this.opts.es5 ? e.varKinds.var : e.varKinds.const;
            $ = (0, t._)`${$}${R} ${m} = ${w};${this.opts._n}`;
          } else if (w = _ == null ? void 0 : _(m))
            $ = (0, t._)`${$}${w}${this.opts._n}`;
          else
            throw new r(m);
          v.set(m, n.Completed);
        });
      }
      return $;
    }
  }
  e.ValueScope = l;
})(Rn);
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.or = e.and = e.not = e.CodeGen = e.operators = e.varKinds = e.ValueScopeName = e.ValueScope = e.Scope = e.Name = e.regexpCode = e.stringify = e.getProperty = e.nil = e.strConcat = e.str = e._ = void 0;
  const t = Xt, r = Rn;
  var n = Xt;
  Object.defineProperty(e, "_", { enumerable: !0, get: function() {
    return n._;
  } }), Object.defineProperty(e, "str", { enumerable: !0, get: function() {
    return n.str;
  } }), Object.defineProperty(e, "strConcat", { enumerable: !0, get: function() {
    return n.strConcat;
  } }), Object.defineProperty(e, "nil", { enumerable: !0, get: function() {
    return n.nil;
  } }), Object.defineProperty(e, "getProperty", { enumerable: !0, get: function() {
    return n.getProperty;
  } }), Object.defineProperty(e, "stringify", { enumerable: !0, get: function() {
    return n.stringify;
  } }), Object.defineProperty(e, "regexpCode", { enumerable: !0, get: function() {
    return n.regexpCode;
  } }), Object.defineProperty(e, "Name", { enumerable: !0, get: function() {
    return n.Name;
  } });
  var s = Rn;
  Object.defineProperty(e, "Scope", { enumerable: !0, get: function() {
    return s.Scope;
  } }), Object.defineProperty(e, "ValueScope", { enumerable: !0, get: function() {
    return s.ValueScope;
  } }), Object.defineProperty(e, "ValueScopeName", { enumerable: !0, get: function() {
    return s.ValueScopeName;
  } }), Object.defineProperty(e, "varKinds", { enumerable: !0, get: function() {
    return s.varKinds;
  } }), e.operators = {
    GT: new t._Code(">"),
    GTE: new t._Code(">="),
    LT: new t._Code("<"),
    LTE: new t._Code("<="),
    EQ: new t._Code("==="),
    NEQ: new t._Code("!=="),
    NOT: new t._Code("!"),
    OR: new t._Code("||"),
    AND: new t._Code("&&"),
    ADD: new t._Code("+")
  };
  class a {
    optimizeNodes() {
      return this;
    }
    optimizeNames(u, h) {
      return this;
    }
  }
  class o extends a {
    constructor(u, h, b) {
      super(), this.varKind = u, this.name = h, this.rhs = b;
    }
    render({ es5: u, _n: h }) {
      const b = u ? r.varKinds.var : this.varKind, L = this.rhs === void 0 ? "" : ` = ${this.rhs}`;
      return `${b} ${this.name}${L};` + h;
    }
    optimizeNames(u, h) {
      if (u[this.name.str])
        return this.rhs && (this.rhs = I(this.rhs, u, h)), this;
    }
    get names() {
      return this.rhs instanceof t._CodeOrName ? this.rhs.names : {};
    }
  }
  class l extends a {
    constructor(u, h, b) {
      super(), this.lhs = u, this.rhs = h, this.sideEffects = b;
    }
    render({ _n: u }) {
      return `${this.lhs} = ${this.rhs};` + u;
    }
    optimizeNames(u, h) {
      if (!(this.lhs instanceof t.Name && !u[this.lhs.str] && !this.sideEffects))
        return this.rhs = I(this.rhs, u, h), this;
    }
    get names() {
      const u = this.lhs instanceof t.Name ? {} : { ...this.lhs.names };
      return Z(u, this.rhs);
    }
  }
  class i extends l {
    constructor(u, h, b, L) {
      super(u, b, L), this.op = h;
    }
    render({ _n: u }) {
      return `${this.lhs} ${this.op}= ${this.rhs};` + u;
    }
  }
  class d extends a {
    constructor(u) {
      super(), this.label = u, this.names = {};
    }
    render({ _n: u }) {
      return `${this.label}:` + u;
    }
  }
  class c extends a {
    constructor(u) {
      super(), this.label = u, this.names = {};
    }
    render({ _n: u }) {
      return `break${this.label ? ` ${this.label}` : ""};` + u;
    }
  }
  class f extends a {
    constructor(u) {
      super(), this.error = u;
    }
    render({ _n: u }) {
      return `throw ${this.error};` + u;
    }
    get names() {
      return this.error.names;
    }
  }
  class _ extends a {
    constructor(u) {
      super(), this.code = u;
    }
    render({ _n: u }) {
      return `${this.code};` + u;
    }
    optimizeNodes() {
      return `${this.code}` ? this : void 0;
    }
    optimizeNames(u, h) {
      return this.code = I(this.code, u, h), this;
    }
    get names() {
      return this.code instanceof t._CodeOrName ? this.code.names : {};
    }
  }
  class $ extends a {
    constructor(u = []) {
      super(), this.nodes = u;
    }
    render(u) {
      return this.nodes.reduce((h, b) => h + b.render(u), "");
    }
    optimizeNodes() {
      const { nodes: u } = this;
      let h = u.length;
      for (; h--; ) {
        const b = u[h].optimizeNodes();
        Array.isArray(b) ? u.splice(h, 1, ...b) : b ? u[h] = b : u.splice(h, 1);
      }
      return u.length > 0 ? this : void 0;
    }
    optimizeNames(u, h) {
      const { nodes: b } = this;
      let L = b.length;
      for (; L--; ) {
        const M = b[L];
        M.optimizeNames(u, h) || (N(u, M.names), b.splice(L, 1));
      }
      return b.length > 0 ? this : void 0;
    }
    get names() {
      return this.nodes.reduce((u, h) => K(u, h.names), {});
    }
  }
  class E extends $ {
    render(u) {
      return "{" + u._n + super.render(u) + "}" + u._n;
    }
  }
  class y extends $ {
  }
  class v extends E {
  }
  v.kind = "else";
  class m extends E {
    constructor(u, h) {
      super(h), this.condition = u;
    }
    render(u) {
      let h = `if(${this.condition})` + super.render(u);
      return this.else && (h += "else " + this.else.render(u)), h;
    }
    optimizeNodes() {
      super.optimizeNodes();
      const u = this.condition;
      if (u === !0)
        return this.nodes;
      let h = this.else;
      if (h) {
        const b = h.optimizeNodes();
        h = this.else = Array.isArray(b) ? new v(b) : b;
      }
      if (h)
        return u === !1 ? h instanceof m ? h : h.nodes : this.nodes.length ? this : new m(C(u), h instanceof m ? [h] : h.nodes);
      if (!(u === !1 || !this.nodes.length))
        return this;
    }
    optimizeNames(u, h) {
      var b;
      if (this.else = (b = this.else) === null || b === void 0 ? void 0 : b.optimizeNames(u, h), !!(super.optimizeNames(u, h) || this.else))
        return this.condition = I(this.condition, u, h), this;
    }
    get names() {
      const u = super.names;
      return Z(u, this.condition), this.else && K(u, this.else.names), u;
    }
  }
  m.kind = "if";
  class w extends E {
  }
  w.kind = "for";
  class R extends w {
    constructor(u) {
      super(), this.iteration = u;
    }
    render(u) {
      return `for(${this.iteration})` + super.render(u);
    }
    optimizeNames(u, h) {
      if (super.optimizeNames(u, h))
        return this.iteration = I(this.iteration, u, h), this;
    }
    get names() {
      return K(super.names, this.iteration.names);
    }
  }
  class O extends w {
    constructor(u, h, b, L) {
      super(), this.varKind = u, this.name = h, this.from = b, this.to = L;
    }
    render(u) {
      const h = u.es5 ? r.varKinds.var : this.varKind, { name: b, from: L, to: M } = this;
      return `for(${h} ${b}=${L}; ${b}<${M}; ${b}++)` + super.render(u);
    }
    get names() {
      const u = Z(super.names, this.from);
      return Z(u, this.to);
    }
  }
  class j extends w {
    constructor(u, h, b, L) {
      super(), this.loop = u, this.varKind = h, this.name = b, this.iterable = L;
    }
    render(u) {
      return `for(${this.varKind} ${this.name} ${this.loop} ${this.iterable})` + super.render(u);
    }
    optimizeNames(u, h) {
      if (super.optimizeNames(u, h))
        return this.iterable = I(this.iterable, u, h), this;
    }
    get names() {
      return K(super.names, this.iterable.names);
    }
  }
  class x extends E {
    constructor(u, h, b) {
      super(), this.name = u, this.args = h, this.async = b;
    }
    render(u) {
      return `${this.async ? "async " : ""}function ${this.name}(${this.args})` + super.render(u);
    }
  }
  x.kind = "func";
  class te extends $ {
    render(u) {
      return "return " + super.render(u);
    }
  }
  te.kind = "return";
  class $e extends E {
    render(u) {
      let h = "try" + super.render(u);
      return this.catch && (h += this.catch.render(u)), this.finally && (h += this.finally.render(u)), h;
    }
    optimizeNodes() {
      var u, h;
      return super.optimizeNodes(), (u = this.catch) === null || u === void 0 || u.optimizeNodes(), (h = this.finally) === null || h === void 0 || h.optimizeNodes(), this;
    }
    optimizeNames(u, h) {
      var b, L;
      return super.optimizeNames(u, h), (b = this.catch) === null || b === void 0 || b.optimizeNames(u, h), (L = this.finally) === null || L === void 0 || L.optimizeNames(u, h), this;
    }
    get names() {
      const u = super.names;
      return this.catch && K(u, this.catch.names), this.finally && K(u, this.finally.names), u;
    }
  }
  class we extends E {
    constructor(u) {
      super(), this.error = u;
    }
    render(u) {
      return `catch(${this.error})` + super.render(u);
    }
  }
  we.kind = "catch";
  class Re extends E {
    render(u) {
      return "finally" + super.render(u);
    }
  }
  Re.kind = "finally";
  class z {
    constructor(u, h = {}) {
      this._values = {}, this._blockStarts = [], this._constants = {}, this.opts = { ...h, _n: h.lines ? `
` : "" }, this._extScope = u, this._scope = new r.Scope({ parent: u }), this._nodes = [new y()];
    }
    toString() {
      return this._root.render(this.opts);
    }
    // returns unique name in the internal scope
    name(u) {
      return this._scope.name(u);
    }
    // reserves unique name in the external scope
    scopeName(u) {
      return this._extScope.name(u);
    }
    // reserves unique name in the external scope and assigns value to it
    scopeValue(u, h) {
      const b = this._extScope.value(u, h);
      return (this._values[b.prefix] || (this._values[b.prefix] = /* @__PURE__ */ new Set())).add(b), b;
    }
    getScopeValue(u, h) {
      return this._extScope.getValue(u, h);
    }
    // return code that assigns values in the external scope to the names that are used internally
    // (same names that were returned by gen.scopeName or gen.scopeValue)
    scopeRefs(u) {
      return this._extScope.scopeRefs(u, this._values);
    }
    scopeCode() {
      return this._extScope.scopeCode(this._values);
    }
    _def(u, h, b, L) {
      const M = this._scope.toName(h);
      return b !== void 0 && L && (this._constants[M.str] = b), this._leafNode(new o(u, M, b)), M;
    }
    // `const` declaration (`var` in es5 mode)
    const(u, h, b) {
      return this._def(r.varKinds.const, u, h, b);
    }
    // `let` declaration with optional assignment (`var` in es5 mode)
    let(u, h, b) {
      return this._def(r.varKinds.let, u, h, b);
    }
    // `var` declaration with optional assignment
    var(u, h, b) {
      return this._def(r.varKinds.var, u, h, b);
    }
    // assignment code
    assign(u, h, b) {
      return this._leafNode(new l(u, h, b));
    }
    // `+=` code
    add(u, h) {
      return this._leafNode(new i(u, e.operators.ADD, h));
    }
    // appends passed SafeExpr to code or executes Block
    code(u) {
      return typeof u == "function" ? u() : u !== t.nil && this._leafNode(new _(u)), this;
    }
    // returns code for object literal for the passed argument list of key-value pairs
    object(...u) {
      const h = ["{"];
      for (const [b, L] of u)
        h.length > 1 && h.push(","), h.push(b), (b !== L || this.opts.es5) && (h.push(":"), (0, t.addCodeArg)(h, L));
      return h.push("}"), new t._Code(h);
    }
    // `if` clause (or statement if `thenBody` and, optionally, `elseBody` are passed)
    if(u, h, b) {
      if (this._blockNode(new m(u)), h && b)
        this.code(h).else().code(b).endIf();
      else if (h)
        this.code(h).endIf();
      else if (b)
        throw new Error('CodeGen: "else" body without "then" body');
      return this;
    }
    // `else if` clause - invalid without `if` or after `else` clauses
    elseIf(u) {
      return this._elseNode(new m(u));
    }
    // `else` clause - only valid after `if` or `else if` clauses
    else() {
      return this._elseNode(new v());
    }
    // end `if` statement (needed if gen.if was used only with condition)
    endIf() {
      return this._endBlockNode(m, v);
    }
    _for(u, h) {
      return this._blockNode(u), h && this.code(h).endFor(), this;
    }
    // a generic `for` clause (or statement if `forBody` is passed)
    for(u, h) {
      return this._for(new R(u), h);
    }
    // `for` statement for a range of values
    forRange(u, h, b, L, M = this.opts.es5 ? r.varKinds.var : r.varKinds.let) {
      const J = this._scope.toName(u);
      return this._for(new O(M, J, h, b), () => L(J));
    }
    // `for-of` statement (in es5 mode replace with a normal for loop)
    forOf(u, h, b, L = r.varKinds.const) {
      const M = this._scope.toName(u);
      if (this.opts.es5) {
        const J = h instanceof t.Name ? h : this.var("_arr", h);
        return this.forRange("_i", 0, (0, t._)`${J}.length`, (B) => {
          this.var(M, (0, t._)`${J}[${B}]`), b(M);
        });
      }
      return this._for(new j("of", L, M, h), () => b(M));
    }
    // `for-in` statement.
    // With option `ownProperties` replaced with a `for-of` loop for object keys
    forIn(u, h, b, L = this.opts.es5 ? r.varKinds.var : r.varKinds.const) {
      if (this.opts.ownProperties)
        return this.forOf(u, (0, t._)`Object.keys(${h})`, b);
      const M = this._scope.toName(u);
      return this._for(new j("in", L, M, h), () => b(M));
    }
    // end `for` loop
    endFor() {
      return this._endBlockNode(w);
    }
    // `label` statement
    label(u) {
      return this._leafNode(new d(u));
    }
    // `break` statement
    break(u) {
      return this._leafNode(new c(u));
    }
    // `return` statement
    return(u) {
      const h = new te();
      if (this._blockNode(h), this.code(u), h.nodes.length !== 1)
        throw new Error('CodeGen: "return" should have one node');
      return this._endBlockNode(te);
    }
    // `try` statement
    try(u, h, b) {
      if (!h && !b)
        throw new Error('CodeGen: "try" without "catch" and "finally"');
      const L = new $e();
      if (this._blockNode(L), this.code(u), h) {
        const M = this.name("e");
        this._currNode = L.catch = new we(M), h(M);
      }
      return b && (this._currNode = L.finally = new Re(), this.code(b)), this._endBlockNode(we, Re);
    }
    // `throw` statement
    throw(u) {
      return this._leafNode(new f(u));
    }
    // start self-balancing block
    block(u, h) {
      return this._blockStarts.push(this._nodes.length), u && this.code(u).endBlock(h), this;
    }
    // end the current self-balancing block
    endBlock(u) {
      const h = this._blockStarts.pop();
      if (h === void 0)
        throw new Error("CodeGen: not in self-balancing block");
      const b = this._nodes.length - h;
      if (b < 0 || u !== void 0 && b !== u)
        throw new Error(`CodeGen: wrong number of nodes: ${b} vs ${u} expected`);
      return this._nodes.length = h, this;
    }
    // `function` heading (or definition if funcBody is passed)
    func(u, h = t.nil, b, L) {
      return this._blockNode(new x(u, h, b)), L && this.code(L).endFunc(), this;
    }
    // end function definition
    endFunc() {
      return this._endBlockNode(x);
    }
    optimize(u = 1) {
      for (; u-- > 0; )
        this._root.optimizeNodes(), this._root.optimizeNames(this._root.names, this._constants);
    }
    _leafNode(u) {
      return this._currNode.nodes.push(u), this;
    }
    _blockNode(u) {
      this._currNode.nodes.push(u), this._nodes.push(u);
    }
    _endBlockNode(u, h) {
      const b = this._currNode;
      if (b instanceof u || h && b instanceof h)
        return this._nodes.pop(), this;
      throw new Error(`CodeGen: not in block "${h ? `${u.kind}/${h.kind}` : u.kind}"`);
    }
    _elseNode(u) {
      const h = this._currNode;
      if (!(h instanceof m))
        throw new Error('CodeGen: "else" without "if"');
      return this._currNode = h.else = u, this;
    }
    get _root() {
      return this._nodes[0];
    }
    get _currNode() {
      const u = this._nodes;
      return u[u.length - 1];
    }
    set _currNode(u) {
      const h = this._nodes;
      h[h.length - 1] = u;
    }
  }
  e.CodeGen = z;
  function K(g, u) {
    for (const h in u)
      g[h] = (g[h] || 0) + (u[h] || 0);
    return g;
  }
  function Z(g, u) {
    return u instanceof t._CodeOrName ? K(g, u.names) : g;
  }
  function I(g, u, h) {
    if (g instanceof t.Name)
      return b(g);
    if (!L(g))
      return g;
    return new t._Code(g._items.reduce((M, J) => (J instanceof t.Name && (J = b(J)), J instanceof t._Code ? M.push(...J._items) : M.push(J), M), []));
    function b(M) {
      const J = h[M.str];
      return J === void 0 || u[M.str] !== 1 ? M : (delete u[M.str], J);
    }
    function L(M) {
      return M instanceof t._Code && M._items.some((J) => J instanceof t.Name && u[J.str] === 1 && h[J.str] !== void 0);
    }
  }
  function N(g, u) {
    for (const h in u)
      g[h] = (g[h] || 0) - (u[h] || 0);
  }
  function C(g) {
    return typeof g == "boolean" || typeof g == "number" || g === null ? !g : (0, t._)`!${S(g)}`;
  }
  e.not = C;
  const A = p(e.operators.AND);
  function V(...g) {
    return g.reduce(A);
  }
  e.and = V;
  const k = p(e.operators.OR);
  function P(...g) {
    return g.reduce(k);
  }
  e.or = P;
  function p(g) {
    return (u, h) => u === t.nil ? h : h === t.nil ? u : (0, t._)`${S(u)} ${g} ${S(h)}`;
  }
  function S(g) {
    return g instanceof t.Name ? g : (0, t._)`(${g})`;
  }
})(U);
var T = {};
Object.defineProperty(T, "__esModule", { value: !0 });
T.checkStrictMode = T.getErrorPath = T.Type = T.useFunc = T.setEvaluated = T.evaluatedPropsToName = T.mergeEvaluated = T.eachItem = T.unescapeJsonPointer = T.escapeJsonPointer = T.escapeFragment = T.unescapeFragment = T.schemaRefOrVal = T.schemaHasRulesButRef = T.schemaHasRules = T.checkUnknownRules = T.alwaysValidSchema = T.toHash = void 0;
const Y = U, nc = Xt;
function sc(e) {
  const t = {};
  for (const r of e)
    t[r] = !0;
  return t;
}
T.toHash = sc;
function ac(e, t) {
  return typeof t == "boolean" ? t : Object.keys(t).length === 0 ? !0 : (co(e, t), !lo(t, e.self.RULES.all));
}
T.alwaysValidSchema = ac;
function co(e, t = e.schema) {
  const { opts: r, self: n } = e;
  if (!r.strictSchema || typeof t == "boolean")
    return;
  const s = n.RULES.keywords;
  for (const a in t)
    s[a] || ho(e, `unknown keyword: "${a}"`);
}
T.checkUnknownRules = co;
function lo(e, t) {
  if (typeof e == "boolean")
    return !e;
  for (const r in e)
    if (t[r])
      return !0;
  return !1;
}
T.schemaHasRules = lo;
function oc(e, t) {
  if (typeof e == "boolean")
    return !e;
  for (const r in e)
    if (r !== "$ref" && t.all[r])
      return !0;
  return !1;
}
T.schemaHasRulesButRef = oc;
function ic({ topSchemaRef: e, schemaPath: t }, r, n, s) {
  if (!s) {
    if (typeof r == "number" || typeof r == "boolean")
      return r;
    if (typeof r == "string")
      return (0, Y._)`${r}`;
  }
  return (0, Y._)`${e}${t}${(0, Y.getProperty)(n)}`;
}
T.schemaRefOrVal = ic;
function cc(e) {
  return uo(decodeURIComponent(e));
}
T.unescapeFragment = cc;
function lc(e) {
  return encodeURIComponent(Un(e));
}
T.escapeFragment = lc;
function Un(e) {
  return typeof e == "number" ? `${e}` : e.replace(/~/g, "~0").replace(/\//g, "~1");
}
T.escapeJsonPointer = Un;
function uo(e) {
  return e.replace(/~1/g, "/").replace(/~0/g, "~");
}
T.unescapeJsonPointer = uo;
function uc(e, t) {
  if (Array.isArray(e))
    for (const r of e)
      t(r);
  else
    t(e);
}
T.eachItem = uc;
function ta({ mergeNames: e, mergeToName: t, mergeValues: r, resultToName: n }) {
  return (s, a, o, l) => {
    const i = o === void 0 ? a : o instanceof Y.Name ? (a instanceof Y.Name ? e(s, a, o) : t(s, a, o), o) : a instanceof Y.Name ? (t(s, o, a), a) : r(a, o);
    return l === Y.Name && !(i instanceof Y.Name) ? n(s, i) : i;
  };
}
T.mergeEvaluated = {
  props: ta({
    mergeNames: (e, t, r) => e.if((0, Y._)`${r} !== true && ${t} !== undefined`, () => {
      e.if((0, Y._)`${t} === true`, () => e.assign(r, !0), () => e.assign(r, (0, Y._)`${r} || {}`).code((0, Y._)`Object.assign(${r}, ${t})`));
    }),
    mergeToName: (e, t, r) => e.if((0, Y._)`${r} !== true`, () => {
      t === !0 ? e.assign(r, !0) : (e.assign(r, (0, Y._)`${r} || {}`), qn(e, r, t));
    }),
    mergeValues: (e, t) => e === !0 ? !0 : { ...e, ...t },
    resultToName: fo
  }),
  items: ta({
    mergeNames: (e, t, r) => e.if((0, Y._)`${r} !== true && ${t} !== undefined`, () => e.assign(r, (0, Y._)`${t} === true ? true : ${r} > ${t} ? ${r} : ${t}`)),
    mergeToName: (e, t, r) => e.if((0, Y._)`${r} !== true`, () => e.assign(r, t === !0 ? !0 : (0, Y._)`${r} > ${t} ? ${r} : ${t}`)),
    mergeValues: (e, t) => e === !0 ? !0 : Math.max(e, t),
    resultToName: (e, t) => e.var("items", t)
  })
};
function fo(e, t) {
  if (t === !0)
    return e.var("props", !0);
  const r = e.var("props", (0, Y._)`{}`);
  return t !== void 0 && qn(e, r, t), r;
}
T.evaluatedPropsToName = fo;
function qn(e, t, r) {
  Object.keys(r).forEach((n) => e.assign((0, Y._)`${t}${(0, Y.getProperty)(n)}`, !0));
}
T.setEvaluated = qn;
const ra = {};
function dc(e, t) {
  return e.scopeValue("func", {
    ref: t,
    code: ra[t.code] || (ra[t.code] = new nc._Code(t.code))
  });
}
T.useFunc = dc;
var In;
(function(e) {
  e[e.Num = 0] = "Num", e[e.Str = 1] = "Str";
})(In || (T.Type = In = {}));
function fc(e, t, r) {
  if (e instanceof Y.Name) {
    const n = t === In.Num;
    return r ? n ? (0, Y._)`"[" + ${e} + "]"` : (0, Y._)`"['" + ${e} + "']"` : n ? (0, Y._)`"/" + ${e}` : (0, Y._)`"/" + ${e}.replace(/~/g, "~0").replace(/\\//g, "~1")`;
  }
  return r ? (0, Y.getProperty)(e).toString() : "/" + Un(e);
}
T.getErrorPath = fc;
function ho(e, t, r = e.opts.strictSchema) {
  if (r) {
    if (t = `strict mode: ${t}`, r === !0)
      throw new Error(t);
    e.self.logger.warn(t);
  }
}
T.checkStrictMode = ho;
var Ee = {};
Object.defineProperty(Ee, "__esModule", { value: !0 });
const ue = U, hc = {
  // validation function arguments
  data: new ue.Name("data"),
  // data passed to validation function
  // args passed from referencing schema
  valCxt: new ue.Name("valCxt"),
  // validation/data context - should not be used directly, it is destructured to the names below
  instancePath: new ue.Name("instancePath"),
  parentData: new ue.Name("parentData"),
  parentDataProperty: new ue.Name("parentDataProperty"),
  rootData: new ue.Name("rootData"),
  // root data - same as the data passed to the first/top validation function
  dynamicAnchors: new ue.Name("dynamicAnchors"),
  // used to support recursiveRef and dynamicRef
  // function scoped variables
  vErrors: new ue.Name("vErrors"),
  // null or array of validation errors
  errors: new ue.Name("errors"),
  // counter of validation errors
  this: new ue.Name("this"),
  // "globals"
  self: new ue.Name("self"),
  scope: new ue.Name("scope"),
  // JTD serialize/parse name for JSON string and position
  json: new ue.Name("json"),
  jsonPos: new ue.Name("jsonPos"),
  jsonLen: new ue.Name("jsonLen"),
  jsonPart: new ue.Name("jsonPart")
};
Ee.default = hc;
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.extendErrors = e.resetErrorsCount = e.reportExtraError = e.reportError = e.keyword$DataError = e.keywordError = void 0;
  const t = U, r = T, n = Ee;
  e.keywordError = {
    message: ({ keyword: v }) => (0, t.str)`must pass "${v}" keyword validation`
  }, e.keyword$DataError = {
    message: ({ keyword: v, schemaType: m }) => m ? (0, t.str)`"${v}" keyword must be ${m} ($data)` : (0, t.str)`"${v}" keyword is invalid ($data)`
  };
  function s(v, m = e.keywordError, w, R) {
    const { it: O } = v, { gen: j, compositeRule: x, allErrors: te } = O, $e = f(v, m, w);
    R ?? (x || te) ? i(j, $e) : d(O, (0, t._)`[${$e}]`);
  }
  e.reportError = s;
  function a(v, m = e.keywordError, w) {
    const { it: R } = v, { gen: O, compositeRule: j, allErrors: x } = R, te = f(v, m, w);
    i(O, te), j || x || d(R, n.default.vErrors);
  }
  e.reportExtraError = a;
  function o(v, m) {
    v.assign(n.default.errors, m), v.if((0, t._)`${n.default.vErrors} !== null`, () => v.if(m, () => v.assign((0, t._)`${n.default.vErrors}.length`, m), () => v.assign(n.default.vErrors, null)));
  }
  e.resetErrorsCount = o;
  function l({ gen: v, keyword: m, schemaValue: w, data: R, errsCount: O, it: j }) {
    if (O === void 0)
      throw new Error("ajv implementation error");
    const x = v.name("err");
    v.forRange("i", O, n.default.errors, (te) => {
      v.const(x, (0, t._)`${n.default.vErrors}[${te}]`), v.if((0, t._)`${x}.instancePath === undefined`, () => v.assign((0, t._)`${x}.instancePath`, (0, t.strConcat)(n.default.instancePath, j.errorPath))), v.assign((0, t._)`${x}.schemaPath`, (0, t.str)`${j.errSchemaPath}/${m}`), j.opts.verbose && (v.assign((0, t._)`${x}.schema`, w), v.assign((0, t._)`${x}.data`, R));
    });
  }
  e.extendErrors = l;
  function i(v, m) {
    const w = v.const("err", m);
    v.if((0, t._)`${n.default.vErrors} === null`, () => v.assign(n.default.vErrors, (0, t._)`[${w}]`), (0, t._)`${n.default.vErrors}.push(${w})`), v.code((0, t._)`${n.default.errors}++`);
  }
  function d(v, m) {
    const { gen: w, validateName: R, schemaEnv: O } = v;
    O.$async ? w.throw((0, t._)`new ${v.ValidationError}(${m})`) : (w.assign((0, t._)`${R}.errors`, m), w.return(!1));
  }
  const c = {
    keyword: new t.Name("keyword"),
    schemaPath: new t.Name("schemaPath"),
    // also used in JTD errors
    params: new t.Name("params"),
    propertyName: new t.Name("propertyName"),
    message: new t.Name("message"),
    schema: new t.Name("schema"),
    parentSchema: new t.Name("parentSchema")
  };
  function f(v, m, w) {
    const { createErrors: R } = v.it;
    return R === !1 ? (0, t._)`{}` : _(v, m, w);
  }
  function _(v, m, w = {}) {
    const { gen: R, it: O } = v, j = [
      $(O, w),
      E(v, w)
    ];
    return y(v, m, j), R.object(...j);
  }
  function $({ errorPath: v }, { instancePath: m }) {
    const w = m ? (0, t.str)`${v}${(0, r.getErrorPath)(m, r.Type.Str)}` : v;
    return [n.default.instancePath, (0, t.strConcat)(n.default.instancePath, w)];
  }
  function E({ keyword: v, it: { errSchemaPath: m } }, { schemaPath: w, parentSchema: R }) {
    let O = R ? m : (0, t.str)`${m}/${v}`;
    return w && (O = (0, t.str)`${O}${(0, r.getErrorPath)(w, r.Type.Str)}`), [c.schemaPath, O];
  }
  function y(v, { params: m, message: w }, R) {
    const { keyword: O, data: j, schemaValue: x, it: te } = v, { opts: $e, propertyName: we, topSchemaRef: Re, schemaPath: z } = te;
    R.push([c.keyword, O], [c.params, typeof m == "function" ? m(v) : m || (0, t._)`{}`]), $e.messages && R.push([c.message, typeof w == "function" ? w(v) : w]), $e.verbose && R.push([c.schema, x], [c.parentSchema, (0, t._)`${Re}${z}`], [n.default.data, j]), we && R.push([c.propertyName, we]);
  }
})(Wt);
Object.defineProperty(It, "__esModule", { value: !0 });
It.boolOrEmptySchema = It.topBoolOrEmptySchema = void 0;
const mc = Wt, pc = U, $c = Ee, yc = {
  message: "boolean schema is false"
};
function gc(e) {
  const { gen: t, schema: r, validateName: n } = e;
  r === !1 ? mo(e, !1) : typeof r == "object" && r.$async === !0 ? t.return($c.default.data) : (t.assign((0, pc._)`${n}.errors`, null), t.return(!0));
}
It.topBoolOrEmptySchema = gc;
function vc(e, t) {
  const { gen: r, schema: n } = e;
  n === !1 ? (r.var(t, !1), mo(e)) : r.var(t, !0);
}
It.boolOrEmptySchema = vc;
function mo(e, t) {
  const { gen: r, data: n } = e, s = {
    gen: r,
    keyword: "false schema",
    data: n,
    schema: !1,
    schemaCode: !1,
    schemaValue: !1,
    params: {},
    it: e
  };
  (0, mc.reportError)(s, yc, void 0, t);
}
var se = {}, ht = {};
Object.defineProperty(ht, "__esModule", { value: !0 });
ht.getRules = ht.isJSONType = void 0;
const _c = ["string", "number", "integer", "boolean", "null", "object", "array"], Ec = new Set(_c);
function wc(e) {
  return typeof e == "string" && Ec.has(e);
}
ht.isJSONType = wc;
function Sc() {
  const e = {
    number: { type: "number", rules: [] },
    string: { type: "string", rules: [] },
    array: { type: "array", rules: [] },
    object: { type: "object", rules: [] }
  };
  return {
    types: { ...e, integer: !0, boolean: !0, null: !0 },
    rules: [{ rules: [] }, e.number, e.string, e.array, e.object],
    post: { rules: [] },
    all: {},
    keywords: {}
  };
}
ht.getRules = Sc;
var Ue = {};
Object.defineProperty(Ue, "__esModule", { value: !0 });
Ue.shouldUseRule = Ue.shouldUseGroup = Ue.schemaHasRulesForType = void 0;
function bc({ schema: e, self: t }, r) {
  const n = t.RULES.types[r];
  return n && n !== !0 && po(e, n);
}
Ue.schemaHasRulesForType = bc;
function po(e, t) {
  return t.rules.some((r) => $o(e, r));
}
Ue.shouldUseGroup = po;
function $o(e, t) {
  var r;
  return e[t.keyword] !== void 0 || ((r = t.definition.implements) === null || r === void 0 ? void 0 : r.some((n) => e[n] !== void 0));
}
Ue.shouldUseRule = $o;
Object.defineProperty(se, "__esModule", { value: !0 });
se.reportTypeError = se.checkDataTypes = se.checkDataType = se.coerceAndCheckDataType = se.getJSONTypes = se.getSchemaTypes = se.DataType = void 0;
const Pc = ht, Rc = Ue, Ic = Wt, H = U, yo = T;
var bt;
(function(e) {
  e[e.Correct = 0] = "Correct", e[e.Wrong = 1] = "Wrong";
})(bt || (se.DataType = bt = {}));
function Nc(e) {
  const t = go(e.type);
  if (t.includes("null")) {
    if (e.nullable === !1)
      throw new Error("type: null contradicts nullable: false");
  } else {
    if (!t.length && e.nullable !== void 0)
      throw new Error('"nullable" cannot be used without "type"');
    e.nullable === !0 && t.push("null");
  }
  return t;
}
se.getSchemaTypes = Nc;
function go(e) {
  const t = Array.isArray(e) ? e : e ? [e] : [];
  if (t.every(Pc.isJSONType))
    return t;
  throw new Error("type must be JSONType or JSONType[]: " + t.join(","));
}
se.getJSONTypes = go;
function Oc(e, t) {
  const { gen: r, data: n, opts: s } = e, a = Tc(t, s.coerceTypes), o = t.length > 0 && !(a.length === 0 && t.length === 1 && (0, Rc.schemaHasRulesForType)(e, t[0]));
  if (o) {
    const l = Gn(t, n, s.strictNumbers, bt.Wrong);
    r.if(l, () => {
      a.length ? jc(e, t, a) : Kn(e);
    });
  }
  return o;
}
se.coerceAndCheckDataType = Oc;
const vo = /* @__PURE__ */ new Set(["string", "number", "integer", "boolean", "null"]);
function Tc(e, t) {
  return t ? e.filter((r) => vo.has(r) || t === "array" && r === "array") : [];
}
function jc(e, t, r) {
  const { gen: n, data: s, opts: a } = e, o = n.let("dataType", (0, H._)`typeof ${s}`), l = n.let("coerced", (0, H._)`undefined`);
  a.coerceTypes === "array" && n.if((0, H._)`${o} == 'object' && Array.isArray(${s}) && ${s}.length == 1`, () => n.assign(s, (0, H._)`${s}[0]`).assign(o, (0, H._)`typeof ${s}`).if(Gn(t, s, a.strictNumbers), () => n.assign(l, s))), n.if((0, H._)`${l} !== undefined`);
  for (const d of r)
    (vo.has(d) || d === "array" && a.coerceTypes === "array") && i(d);
  n.else(), Kn(e), n.endIf(), n.if((0, H._)`${l} !== undefined`, () => {
    n.assign(s, l), Ac(e, l);
  });
  function i(d) {
    switch (d) {
      case "string":
        n.elseIf((0, H._)`${o} == "number" || ${o} == "boolean"`).assign(l, (0, H._)`"" + ${s}`).elseIf((0, H._)`${s} === null`).assign(l, (0, H._)`""`);
        return;
      case "number":
        n.elseIf((0, H._)`${o} == "boolean" || ${s} === null
              || (${o} == "string" && ${s} && ${s} == +${s})`).assign(l, (0, H._)`+${s}`);
        return;
      case "integer":
        n.elseIf((0, H._)`${o} === "boolean" || ${s} === null
              || (${o} === "string" && ${s} && ${s} == +${s} && !(${s} % 1))`).assign(l, (0, H._)`+${s}`);
        return;
      case "boolean":
        n.elseIf((0, H._)`${s} === "false" || ${s} === 0 || ${s} === null`).assign(l, !1).elseIf((0, H._)`${s} === "true" || ${s} === 1`).assign(l, !0);
        return;
      case "null":
        n.elseIf((0, H._)`${s} === "" || ${s} === 0 || ${s} === false`), n.assign(l, null);
        return;
      case "array":
        n.elseIf((0, H._)`${o} === "string" || ${o} === "number"
              || ${o} === "boolean" || ${s} === null`).assign(l, (0, H._)`[${s}]`);
    }
  }
}
function Ac({ gen: e, parentData: t, parentDataProperty: r }, n) {
  e.if((0, H._)`${t} !== undefined`, () => e.assign((0, H._)`${t}[${r}]`, n));
}
function Nn(e, t, r, n = bt.Correct) {
  const s = n === bt.Correct ? H.operators.EQ : H.operators.NEQ;
  let a;
  switch (e) {
    case "null":
      return (0, H._)`${t} ${s} null`;
    case "array":
      a = (0, H._)`Array.isArray(${t})`;
      break;
    case "object":
      a = (0, H._)`${t} && typeof ${t} == "object" && !Array.isArray(${t})`;
      break;
    case "integer":
      a = o((0, H._)`!(${t} % 1) && !isNaN(${t})`);
      break;
    case "number":
      a = o();
      break;
    default:
      return (0, H._)`typeof ${t} ${s} ${e}`;
  }
  return n === bt.Correct ? a : (0, H.not)(a);
  function o(l = H.nil) {
    return (0, H.and)((0, H._)`typeof ${t} == "number"`, l, r ? (0, H._)`isFinite(${t})` : H.nil);
  }
}
se.checkDataType = Nn;
function Gn(e, t, r, n) {
  if (e.length === 1)
    return Nn(e[0], t, r, n);
  let s;
  const a = (0, yo.toHash)(e);
  if (a.array && a.object) {
    const o = (0, H._)`typeof ${t} != "object"`;
    s = a.null ? o : (0, H._)`!${t} || ${o}`, delete a.null, delete a.array, delete a.object;
  } else
    s = H.nil;
  a.number && delete a.integer;
  for (const o in a)
    s = (0, H.and)(s, Nn(o, t, r, n));
  return s;
}
se.checkDataTypes = Gn;
const kc = {
  message: ({ schema: e }) => `must be ${e}`,
  params: ({ schema: e, schemaValue: t }) => typeof e == "string" ? (0, H._)`{type: ${e}}` : (0, H._)`{type: ${t}}`
};
function Kn(e) {
  const t = Cc(e);
  (0, Ic.reportError)(t, kc);
}
se.reportTypeError = Kn;
function Cc(e) {
  const { gen: t, data: r, schema: n } = e, s = (0, yo.schemaRefOrVal)(e, n, "type");
  return {
    gen: t,
    keyword: "type",
    data: r,
    schema: n.type,
    schemaCode: s,
    schemaValue: s,
    parentSchema: n,
    params: {},
    it: e
  };
}
var Ir = {};
Object.defineProperty(Ir, "__esModule", { value: !0 });
Ir.assignDefaults = void 0;
const vt = U, Dc = T;
function Lc(e, t) {
  const { properties: r, items: n } = e.schema;
  if (t === "object" && r)
    for (const s in r)
      na(e, s, r[s].default);
  else t === "array" && Array.isArray(n) && n.forEach((s, a) => na(e, a, s.default));
}
Ir.assignDefaults = Lc;
function na(e, t, r) {
  const { gen: n, compositeRule: s, data: a, opts: o } = e;
  if (r === void 0)
    return;
  const l = (0, vt._)`${a}${(0, vt.getProperty)(t)}`;
  if (s) {
    (0, Dc.checkStrictMode)(e, `default is ignored for: ${l}`);
    return;
  }
  let i = (0, vt._)`${l} === undefined`;
  o.useDefaults === "empty" && (i = (0, vt._)`${i} || ${l} === null || ${l} === ""`), n.if(i, (0, vt._)`${l} = ${(0, vt.stringify)(r)}`);
}
var Me = {}, W = {};
Object.defineProperty(W, "__esModule", { value: !0 });
W.validateUnion = W.validateArray = W.usePattern = W.callValidateCode = W.schemaProperties = W.allSchemaProperties = W.noPropertyInData = W.propertyInData = W.isOwnProperty = W.hasPropFunc = W.reportMissingProp = W.checkMissingProp = W.checkReportMissingProp = void 0;
const Q = U, Hn = T, Be = Ee, Mc = T;
function Vc(e, t) {
  const { gen: r, data: n, it: s } = e;
  r.if(Wn(r, n, t, s.opts.ownProperties), () => {
    e.setParams({ missingProperty: (0, Q._)`${t}` }, !0), e.error();
  });
}
W.checkReportMissingProp = Vc;
function zc({ gen: e, data: t, it: { opts: r } }, n, s) {
  return (0, Q.or)(...n.map((a) => (0, Q.and)(Wn(e, t, a, r.ownProperties), (0, Q._)`${s} = ${a}`)));
}
W.checkMissingProp = zc;
function Fc(e, t) {
  e.setParams({ missingProperty: t }, !0), e.error();
}
W.reportMissingProp = Fc;
function _o(e) {
  return e.scopeValue("func", {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    ref: Object.prototype.hasOwnProperty,
    code: (0, Q._)`Object.prototype.hasOwnProperty`
  });
}
W.hasPropFunc = _o;
function Xn(e, t, r) {
  return (0, Q._)`${_o(e)}.call(${t}, ${r})`;
}
W.isOwnProperty = Xn;
function Uc(e, t, r, n) {
  const s = (0, Q._)`${t}${(0, Q.getProperty)(r)} !== undefined`;
  return n ? (0, Q._)`${s} && ${Xn(e, t, r)}` : s;
}
W.propertyInData = Uc;
function Wn(e, t, r, n) {
  const s = (0, Q._)`${t}${(0, Q.getProperty)(r)} === undefined`;
  return n ? (0, Q.or)(s, (0, Q.not)(Xn(e, t, r))) : s;
}
W.noPropertyInData = Wn;
function Eo(e) {
  return e ? Object.keys(e).filter((t) => t !== "__proto__") : [];
}
W.allSchemaProperties = Eo;
function qc(e, t) {
  return Eo(t).filter((r) => !(0, Hn.alwaysValidSchema)(e, t[r]));
}
W.schemaProperties = qc;
function Gc({ schemaCode: e, data: t, it: { gen: r, topSchemaRef: n, schemaPath: s, errorPath: a }, it: o }, l, i, d) {
  const c = d ? (0, Q._)`${e}, ${t}, ${n}${s}` : t, f = [
    [Be.default.instancePath, (0, Q.strConcat)(Be.default.instancePath, a)],
    [Be.default.parentData, o.parentData],
    [Be.default.parentDataProperty, o.parentDataProperty],
    [Be.default.rootData, Be.default.rootData]
  ];
  o.opts.dynamicRef && f.push([Be.default.dynamicAnchors, Be.default.dynamicAnchors]);
  const _ = (0, Q._)`${c}, ${r.object(...f)}`;
  return i !== Q.nil ? (0, Q._)`${l}.call(${i}, ${_})` : (0, Q._)`${l}(${_})`;
}
W.callValidateCode = Gc;
const Kc = (0, Q._)`new RegExp`;
function Hc({ gen: e, it: { opts: t } }, r) {
  const n = t.unicodeRegExp ? "u" : "", { regExp: s } = t.code, a = s(r, n);
  return e.scopeValue("pattern", {
    key: a.toString(),
    ref: a,
    code: (0, Q._)`${s.code === "new RegExp" ? Kc : (0, Mc.useFunc)(e, s)}(${r}, ${n})`
  });
}
W.usePattern = Hc;
function Xc(e) {
  const { gen: t, data: r, keyword: n, it: s } = e, a = t.name("valid");
  if (s.allErrors) {
    const l = t.let("valid", !0);
    return o(() => t.assign(l, !1)), l;
  }
  return t.var(a, !0), o(() => t.break()), a;
  function o(l) {
    const i = t.const("len", (0, Q._)`${r}.length`);
    t.forRange("i", 0, i, (d) => {
      e.subschema({
        keyword: n,
        dataProp: d,
        dataPropType: Hn.Type.Num
      }, a), t.if((0, Q.not)(a), l);
    });
  }
}
W.validateArray = Xc;
function Wc(e) {
  const { gen: t, schema: r, keyword: n, it: s } = e;
  if (!Array.isArray(r))
    throw new Error("ajv implementation error");
  if (r.some((i) => (0, Hn.alwaysValidSchema)(s, i)) && !s.opts.unevaluated)
    return;
  const o = t.let("valid", !1), l = t.name("_valid");
  t.block(() => r.forEach((i, d) => {
    const c = e.subschema({
      keyword: n,
      schemaProp: d,
      compositeRule: !0
    }, l);
    t.assign(o, (0, Q._)`${o} || ${l}`), e.mergeValidEvaluated(c, l) || t.if((0, Q.not)(o));
  })), e.result(o, () => e.reset(), () => e.error(!0));
}
W.validateUnion = Wc;
Object.defineProperty(Me, "__esModule", { value: !0 });
Me.validateKeywordUsage = Me.validSchemaType = Me.funcKeywordCode = Me.macroKeywordCode = void 0;
const he = U, ot = Ee, Bc = W, xc = Wt;
function Jc(e, t) {
  const { gen: r, keyword: n, schema: s, parentSchema: a, it: o } = e, l = t.macro.call(o.self, s, a, o), i = wo(r, n, l);
  o.opts.validateSchema !== !1 && o.self.validateSchema(l, !0);
  const d = r.name("valid");
  e.subschema({
    schema: l,
    schemaPath: he.nil,
    errSchemaPath: `${o.errSchemaPath}/${n}`,
    topSchemaRef: i,
    compositeRule: !0
  }, d), e.pass(d, () => e.error(!0));
}
Me.macroKeywordCode = Jc;
function Yc(e, t) {
  var r;
  const { gen: n, keyword: s, schema: a, parentSchema: o, $data: l, it: i } = e;
  Qc(i, t);
  const d = !l && t.compile ? t.compile.call(i.self, a, o, i) : t.validate, c = wo(n, s, d), f = n.let("valid");
  e.block$data(f, _), e.ok((r = t.valid) !== null && r !== void 0 ? r : f);
  function _() {
    if (t.errors === !1)
      y(), t.modifying && sa(e), v(() => e.error());
    else {
      const m = t.async ? $() : E();
      t.modifying && sa(e), v(() => Zc(e, m));
    }
  }
  function $() {
    const m = n.let("ruleErrs", null);
    return n.try(() => y((0, he._)`await `), (w) => n.assign(f, !1).if((0, he._)`${w} instanceof ${i.ValidationError}`, () => n.assign(m, (0, he._)`${w}.errors`), () => n.throw(w))), m;
  }
  function E() {
    const m = (0, he._)`${c}.errors`;
    return n.assign(m, null), y(he.nil), m;
  }
  function y(m = t.async ? (0, he._)`await ` : he.nil) {
    const w = i.opts.passContext ? ot.default.this : ot.default.self, R = !("compile" in t && !l || t.schema === !1);
    n.assign(f, (0, he._)`${m}${(0, Bc.callValidateCode)(e, c, w, R)}`, t.modifying);
  }
  function v(m) {
    var w;
    n.if((0, he.not)((w = t.valid) !== null && w !== void 0 ? w : f), m);
  }
}
Me.funcKeywordCode = Yc;
function sa(e) {
  const { gen: t, data: r, it: n } = e;
  t.if(n.parentData, () => t.assign(r, (0, he._)`${n.parentData}[${n.parentDataProperty}]`));
}
function Zc(e, t) {
  const { gen: r } = e;
  r.if((0, he._)`Array.isArray(${t})`, () => {
    r.assign(ot.default.vErrors, (0, he._)`${ot.default.vErrors} === null ? ${t} : ${ot.default.vErrors}.concat(${t})`).assign(ot.default.errors, (0, he._)`${ot.default.vErrors}.length`), (0, xc.extendErrors)(e);
  }, () => e.error());
}
function Qc({ schemaEnv: e }, t) {
  if (t.async && !e.$async)
    throw new Error("async keyword in sync schema");
}
function wo(e, t, r) {
  if (r === void 0)
    throw new Error(`keyword "${t}" failed to compile`);
  return e.scopeValue("keyword", typeof r == "function" ? { ref: r } : { ref: r, code: (0, he.stringify)(r) });
}
function el(e, t, r = !1) {
  return !t.length || t.some((n) => n === "array" ? Array.isArray(e) : n === "object" ? e && typeof e == "object" && !Array.isArray(e) : typeof e == n || r && typeof e > "u");
}
Me.validSchemaType = el;
function tl({ schema: e, opts: t, self: r, errSchemaPath: n }, s, a) {
  if (Array.isArray(s.keyword) ? !s.keyword.includes(a) : s.keyword !== a)
    throw new Error("ajv implementation error");
  const o = s.dependencies;
  if (o != null && o.some((l) => !Object.prototype.hasOwnProperty.call(e, l)))
    throw new Error(`parent schema must have dependencies of ${a}: ${o.join(",")}`);
  if (s.validateSchema && !s.validateSchema(e[a])) {
    const i = `keyword "${a}" value is invalid at path "${n}": ` + r.errorsText(s.validateSchema.errors);
    if (t.validateSchema === "log")
      r.logger.error(i);
    else
      throw new Error(i);
  }
}
Me.validateKeywordUsage = tl;
var nt = {};
Object.defineProperty(nt, "__esModule", { value: !0 });
nt.extendSubschemaMode = nt.extendSubschemaData = nt.getSubschema = void 0;
const Le = U, So = T;
function rl(e, { keyword: t, schemaProp: r, schema: n, schemaPath: s, errSchemaPath: a, topSchemaRef: o }) {
  if (t !== void 0 && n !== void 0)
    throw new Error('both "keyword" and "schema" passed, only one allowed');
  if (t !== void 0) {
    const l = e.schema[t];
    return r === void 0 ? {
      schema: l,
      schemaPath: (0, Le._)`${e.schemaPath}${(0, Le.getProperty)(t)}`,
      errSchemaPath: `${e.errSchemaPath}/${t}`
    } : {
      schema: l[r],
      schemaPath: (0, Le._)`${e.schemaPath}${(0, Le.getProperty)(t)}${(0, Le.getProperty)(r)}`,
      errSchemaPath: `${e.errSchemaPath}/${t}/${(0, So.escapeFragment)(r)}`
    };
  }
  if (n !== void 0) {
    if (s === void 0 || a === void 0 || o === void 0)
      throw new Error('"schemaPath", "errSchemaPath" and "topSchemaRef" are required with "schema"');
    return {
      schema: n,
      schemaPath: s,
      topSchemaRef: o,
      errSchemaPath: a
    };
  }
  throw new Error('either "keyword" or "schema" must be passed');
}
nt.getSubschema = rl;
function nl(e, t, { dataProp: r, dataPropType: n, data: s, dataTypes: a, propertyName: o }) {
  if (s !== void 0 && r !== void 0)
    throw new Error('both "data" and "dataProp" passed, only one allowed');
  const { gen: l } = t;
  if (r !== void 0) {
    const { errorPath: d, dataPathArr: c, opts: f } = t, _ = l.let("data", (0, Le._)`${t.data}${(0, Le.getProperty)(r)}`, !0);
    i(_), e.errorPath = (0, Le.str)`${d}${(0, So.getErrorPath)(r, n, f.jsPropertySyntax)}`, e.parentDataProperty = (0, Le._)`${r}`, e.dataPathArr = [...c, e.parentDataProperty];
  }
  if (s !== void 0) {
    const d = s instanceof Le.Name ? s : l.let("data", s, !0);
    i(d), o !== void 0 && (e.propertyName = o);
  }
  a && (e.dataTypes = a);
  function i(d) {
    e.data = d, e.dataLevel = t.dataLevel + 1, e.dataTypes = [], t.definedProperties = /* @__PURE__ */ new Set(), e.parentData = t.data, e.dataNames = [...t.dataNames, d];
  }
}
nt.extendSubschemaData = nl;
function sl(e, { jtdDiscriminator: t, jtdMetadata: r, compositeRule: n, createErrors: s, allErrors: a }) {
  n !== void 0 && (e.compositeRule = n), s !== void 0 && (e.createErrors = s), a !== void 0 && (e.allErrors = a), e.jtdDiscriminator = t, e.jtdMetadata = r;
}
nt.extendSubschemaMode = sl;
var ce = {}, bo = function e(t, r) {
  if (t === r) return !0;
  if (t && r && typeof t == "object" && typeof r == "object") {
    if (t.constructor !== r.constructor) return !1;
    var n, s, a;
    if (Array.isArray(t)) {
      if (n = t.length, n != r.length) return !1;
      for (s = n; s-- !== 0; )
        if (!e(t[s], r[s])) return !1;
      return !0;
    }
    if (t.constructor === RegExp) return t.source === r.source && t.flags === r.flags;
    if (t.valueOf !== Object.prototype.valueOf) return t.valueOf() === r.valueOf();
    if (t.toString !== Object.prototype.toString) return t.toString() === r.toString();
    if (a = Object.keys(t), n = a.length, n !== Object.keys(r).length) return !1;
    for (s = n; s-- !== 0; )
      if (!Object.prototype.hasOwnProperty.call(r, a[s])) return !1;
    for (s = n; s-- !== 0; ) {
      var o = a[s];
      if (!e(t[o], r[o])) return !1;
    }
    return !0;
  }
  return t !== t && r !== r;
}, Po = { exports: {} }, rt = Po.exports = function(e, t, r) {
  typeof t == "function" && (r = t, t = {}), r = t.cb || r;
  var n = typeof r == "function" ? r : r.pre || function() {
  }, s = r.post || function() {
  };
  fr(t, n, s, e, "", e);
};
rt.keywords = {
  additionalItems: !0,
  items: !0,
  contains: !0,
  additionalProperties: !0,
  propertyNames: !0,
  not: !0,
  if: !0,
  then: !0,
  else: !0
};
rt.arrayKeywords = {
  items: !0,
  allOf: !0,
  anyOf: !0,
  oneOf: !0
};
rt.propsKeywords = {
  $defs: !0,
  definitions: !0,
  properties: !0,
  patternProperties: !0,
  dependencies: !0
};
rt.skipKeywords = {
  default: !0,
  enum: !0,
  const: !0,
  required: !0,
  maximum: !0,
  minimum: !0,
  exclusiveMaximum: !0,
  exclusiveMinimum: !0,
  multipleOf: !0,
  maxLength: !0,
  minLength: !0,
  pattern: !0,
  format: !0,
  maxItems: !0,
  minItems: !0,
  uniqueItems: !0,
  maxProperties: !0,
  minProperties: !0
};
function fr(e, t, r, n, s, a, o, l, i, d) {
  if (n && typeof n == "object" && !Array.isArray(n)) {
    t(n, s, a, o, l, i, d);
    for (var c in n) {
      var f = n[c];
      if (Array.isArray(f)) {
        if (c in rt.arrayKeywords)
          for (var _ = 0; _ < f.length; _++)
            fr(e, t, r, f[_], s + "/" + c + "/" + _, a, s, c, n, _);
      } else if (c in rt.propsKeywords) {
        if (f && typeof f == "object")
          for (var $ in f)
            fr(e, t, r, f[$], s + "/" + c + "/" + al($), a, s, c, n, $);
      } else (c in rt.keywords || e.allKeys && !(c in rt.skipKeywords)) && fr(e, t, r, f, s + "/" + c, a, s, c, n);
    }
    r(n, s, a, o, l, i, d);
  }
}
function al(e) {
  return e.replace(/~/g, "~0").replace(/\//g, "~1");
}
var ol = Po.exports;
Object.defineProperty(ce, "__esModule", { value: !0 });
ce.getSchemaRefs = ce.resolveUrl = ce.normalizeId = ce._getFullPath = ce.getFullPath = ce.inlineRef = void 0;
const il = T, cl = bo, ll = ol, ul = /* @__PURE__ */ new Set([
  "type",
  "format",
  "pattern",
  "maxLength",
  "minLength",
  "maxProperties",
  "minProperties",
  "maxItems",
  "minItems",
  "maximum",
  "minimum",
  "uniqueItems",
  "multipleOf",
  "required",
  "enum",
  "const"
]);
function dl(e, t = !0) {
  return typeof e == "boolean" ? !0 : t === !0 ? !On(e) : t ? Ro(e) <= t : !1;
}
ce.inlineRef = dl;
const fl = /* @__PURE__ */ new Set([
  "$ref",
  "$recursiveRef",
  "$recursiveAnchor",
  "$dynamicRef",
  "$dynamicAnchor"
]);
function On(e) {
  for (const t in e) {
    if (fl.has(t))
      return !0;
    const r = e[t];
    if (Array.isArray(r) && r.some(On) || typeof r == "object" && On(r))
      return !0;
  }
  return !1;
}
function Ro(e) {
  let t = 0;
  for (const r in e) {
    if (r === "$ref")
      return 1 / 0;
    if (t++, !ul.has(r) && (typeof e[r] == "object" && (0, il.eachItem)(e[r], (n) => t += Ro(n)), t === 1 / 0))
      return 1 / 0;
  }
  return t;
}
function Io(e, t = "", r) {
  r !== !1 && (t = Pt(t));
  const n = e.parse(t);
  return No(e, n);
}
ce.getFullPath = Io;
function No(e, t) {
  return e.serialize(t).split("#")[0] + "#";
}
ce._getFullPath = No;
const hl = /#\/?$/;
function Pt(e) {
  return e ? e.replace(hl, "") : "";
}
ce.normalizeId = Pt;
function ml(e, t, r) {
  return r = Pt(r), e.resolve(t, r);
}
ce.resolveUrl = ml;
const pl = /^[a-z_][-a-z0-9._]*$/i;
function $l(e, t) {
  if (typeof e == "boolean")
    return {};
  const { schemaId: r, uriResolver: n } = this.opts, s = Pt(e[r] || t), a = { "": s }, o = Io(n, s, !1), l = {}, i = /* @__PURE__ */ new Set();
  return ll(e, { allKeys: !0 }, (f, _, $, E) => {
    if (E === void 0)
      return;
    const y = o + _;
    let v = a[E];
    typeof f[r] == "string" && (v = m.call(this, f[r])), w.call(this, f.$anchor), w.call(this, f.$dynamicAnchor), a[_] = v;
    function m(R) {
      const O = this.opts.uriResolver.resolve;
      if (R = Pt(v ? O(v, R) : R), i.has(R))
        throw c(R);
      i.add(R);
      let j = this.refs[R];
      return typeof j == "string" && (j = this.refs[j]), typeof j == "object" ? d(f, j.schema, R) : R !== Pt(y) && (R[0] === "#" ? (d(f, l[R], R), l[R] = f) : this.refs[R] = y), R;
    }
    function w(R) {
      if (typeof R == "string") {
        if (!pl.test(R))
          throw new Error(`invalid anchor "${R}"`);
        m.call(this, `#${R}`);
      }
    }
  }), l;
  function d(f, _, $) {
    if (_ !== void 0 && !cl(f, _))
      throw c($);
  }
  function c(f) {
    return new Error(`reference "${f}" resolves to more than one schema`);
  }
}
ce.getSchemaRefs = $l;
Object.defineProperty(Pe, "__esModule", { value: !0 });
Pe.getData = Pe.KeywordCxt = Pe.validateFunctionCode = void 0;
const Oo = It, aa = se, Bn = Ue, vr = se, yl = Ir, Ut = Me, ln = nt, D = U, F = Ee, gl = ce, qe = T, Lt = Wt;
function vl(e) {
  if (Ao(e) && (ko(e), jo(e))) {
    wl(e);
    return;
  }
  To(e, () => (0, Oo.topBoolOrEmptySchema)(e));
}
Pe.validateFunctionCode = vl;
function To({ gen: e, validateName: t, schema: r, schemaEnv: n, opts: s }, a) {
  s.code.es5 ? e.func(t, (0, D._)`${F.default.data}, ${F.default.valCxt}`, n.$async, () => {
    e.code((0, D._)`"use strict"; ${oa(r, s)}`), El(e, s), e.code(a);
  }) : e.func(t, (0, D._)`${F.default.data}, ${_l(s)}`, n.$async, () => e.code(oa(r, s)).code(a));
}
function _l(e) {
  return (0, D._)`{${F.default.instancePath}="", ${F.default.parentData}, ${F.default.parentDataProperty}, ${F.default.rootData}=${F.default.data}${e.dynamicRef ? (0, D._)`, ${F.default.dynamicAnchors}={}` : D.nil}}={}`;
}
function El(e, t) {
  e.if(F.default.valCxt, () => {
    e.var(F.default.instancePath, (0, D._)`${F.default.valCxt}.${F.default.instancePath}`), e.var(F.default.parentData, (0, D._)`${F.default.valCxt}.${F.default.parentData}`), e.var(F.default.parentDataProperty, (0, D._)`${F.default.valCxt}.${F.default.parentDataProperty}`), e.var(F.default.rootData, (0, D._)`${F.default.valCxt}.${F.default.rootData}`), t.dynamicRef && e.var(F.default.dynamicAnchors, (0, D._)`${F.default.valCxt}.${F.default.dynamicAnchors}`);
  }, () => {
    e.var(F.default.instancePath, (0, D._)`""`), e.var(F.default.parentData, (0, D._)`undefined`), e.var(F.default.parentDataProperty, (0, D._)`undefined`), e.var(F.default.rootData, F.default.data), t.dynamicRef && e.var(F.default.dynamicAnchors, (0, D._)`{}`);
  });
}
function wl(e) {
  const { schema: t, opts: r, gen: n } = e;
  To(e, () => {
    r.$comment && t.$comment && Do(e), Il(e), n.let(F.default.vErrors, null), n.let(F.default.errors, 0), r.unevaluated && Sl(e), Co(e), Tl(e);
  });
}
function Sl(e) {
  const { gen: t, validateName: r } = e;
  e.evaluated = t.const("evaluated", (0, D._)`${r}.evaluated`), t.if((0, D._)`${e.evaluated}.dynamicProps`, () => t.assign((0, D._)`${e.evaluated}.props`, (0, D._)`undefined`)), t.if((0, D._)`${e.evaluated}.dynamicItems`, () => t.assign((0, D._)`${e.evaluated}.items`, (0, D._)`undefined`));
}
function oa(e, t) {
  const r = typeof e == "object" && e[t.schemaId];
  return r && (t.code.source || t.code.process) ? (0, D._)`/*# sourceURL=${r} */` : D.nil;
}
function bl(e, t) {
  if (Ao(e) && (ko(e), jo(e))) {
    Pl(e, t);
    return;
  }
  (0, Oo.boolOrEmptySchema)(e, t);
}
function jo({ schema: e, self: t }) {
  if (typeof e == "boolean")
    return !e;
  for (const r in e)
    if (t.RULES.all[r])
      return !0;
  return !1;
}
function Ao(e) {
  return typeof e.schema != "boolean";
}
function Pl(e, t) {
  const { schema: r, gen: n, opts: s } = e;
  s.$comment && r.$comment && Do(e), Nl(e), Ol(e);
  const a = n.const("_errs", F.default.errors);
  Co(e, a), n.var(t, (0, D._)`${a} === ${F.default.errors}`);
}
function ko(e) {
  (0, qe.checkUnknownRules)(e), Rl(e);
}
function Co(e, t) {
  if (e.opts.jtd)
    return ia(e, [], !1, t);
  const r = (0, aa.getSchemaTypes)(e.schema), n = (0, aa.coerceAndCheckDataType)(e, r);
  ia(e, r, !n, t);
}
function Rl(e) {
  const { schema: t, errSchemaPath: r, opts: n, self: s } = e;
  t.$ref && n.ignoreKeywordsWithRef && (0, qe.schemaHasRulesButRef)(t, s.RULES) && s.logger.warn(`$ref: keywords ignored in schema at path "${r}"`);
}
function Il(e) {
  const { schema: t, opts: r } = e;
  t.default !== void 0 && r.useDefaults && r.strictSchema && (0, qe.checkStrictMode)(e, "default is ignored in the schema root");
}
function Nl(e) {
  const t = e.schema[e.opts.schemaId];
  t && (e.baseId = (0, gl.resolveUrl)(e.opts.uriResolver, e.baseId, t));
}
function Ol(e) {
  if (e.schema.$async && !e.schemaEnv.$async)
    throw new Error("async schema in sync schema");
}
function Do({ gen: e, schemaEnv: t, schema: r, errSchemaPath: n, opts: s }) {
  const a = r.$comment;
  if (s.$comment === !0)
    e.code((0, D._)`${F.default.self}.logger.log(${a})`);
  else if (typeof s.$comment == "function") {
    const o = (0, D.str)`${n}/$comment`, l = e.scopeValue("root", { ref: t.root });
    e.code((0, D._)`${F.default.self}.opts.$comment(${a}, ${o}, ${l}.schema)`);
  }
}
function Tl(e) {
  const { gen: t, schemaEnv: r, validateName: n, ValidationError: s, opts: a } = e;
  r.$async ? t.if((0, D._)`${F.default.errors} === 0`, () => t.return(F.default.data), () => t.throw((0, D._)`new ${s}(${F.default.vErrors})`)) : (t.assign((0, D._)`${n}.errors`, F.default.vErrors), a.unevaluated && jl(e), t.return((0, D._)`${F.default.errors} === 0`));
}
function jl({ gen: e, evaluated: t, props: r, items: n }) {
  r instanceof D.Name && e.assign((0, D._)`${t}.props`, r), n instanceof D.Name && e.assign((0, D._)`${t}.items`, n);
}
function ia(e, t, r, n) {
  const { gen: s, schema: a, data: o, allErrors: l, opts: i, self: d } = e, { RULES: c } = d;
  if (a.$ref && (i.ignoreKeywordsWithRef || !(0, qe.schemaHasRulesButRef)(a, c))) {
    s.block(() => Vo(e, "$ref", c.all.$ref.definition));
    return;
  }
  i.jtd || Al(e, t), s.block(() => {
    for (const _ of c.rules)
      f(_);
    f(c.post);
  });
  function f(_) {
    (0, Bn.shouldUseGroup)(a, _) && (_.type ? (s.if((0, vr.checkDataType)(_.type, o, i.strictNumbers)), ca(e, _), t.length === 1 && t[0] === _.type && r && (s.else(), (0, vr.reportTypeError)(e)), s.endIf()) : ca(e, _), l || s.if((0, D._)`${F.default.errors} === ${n || 0}`));
  }
}
function ca(e, t) {
  const { gen: r, schema: n, opts: { useDefaults: s } } = e;
  s && (0, yl.assignDefaults)(e, t.type), r.block(() => {
    for (const a of t.rules)
      (0, Bn.shouldUseRule)(n, a) && Vo(e, a.keyword, a.definition, t.type);
  });
}
function Al(e, t) {
  e.schemaEnv.meta || !e.opts.strictTypes || (kl(e, t), e.opts.allowUnionTypes || Cl(e, t), Dl(e, e.dataTypes));
}
function kl(e, t) {
  if (t.length) {
    if (!e.dataTypes.length) {
      e.dataTypes = t;
      return;
    }
    t.forEach((r) => {
      Lo(e.dataTypes, r) || xn(e, `type "${r}" not allowed by context "${e.dataTypes.join(",")}"`);
    }), Ml(e, t);
  }
}
function Cl(e, t) {
  t.length > 1 && !(t.length === 2 && t.includes("null")) && xn(e, "use allowUnionTypes to allow union type keyword");
}
function Dl(e, t) {
  const r = e.self.RULES.all;
  for (const n in r) {
    const s = r[n];
    if (typeof s == "object" && (0, Bn.shouldUseRule)(e.schema, s)) {
      const { type: a } = s.definition;
      a.length && !a.some((o) => Ll(t, o)) && xn(e, `missing type "${a.join(",")}" for keyword "${n}"`);
    }
  }
}
function Ll(e, t) {
  return e.includes(t) || t === "number" && e.includes("integer");
}
function Lo(e, t) {
  return e.includes(t) || t === "integer" && e.includes("number");
}
function Ml(e, t) {
  const r = [];
  for (const n of e.dataTypes)
    Lo(t, n) ? r.push(n) : t.includes("integer") && n === "number" && r.push("integer");
  e.dataTypes = r;
}
function xn(e, t) {
  const r = e.schemaEnv.baseId + e.errSchemaPath;
  t += ` at "${r}" (strictTypes)`, (0, qe.checkStrictMode)(e, t, e.opts.strictTypes);
}
class Mo {
  constructor(t, r, n) {
    if ((0, Ut.validateKeywordUsage)(t, r, n), this.gen = t.gen, this.allErrors = t.allErrors, this.keyword = n, this.data = t.data, this.schema = t.schema[n], this.$data = r.$data && t.opts.$data && this.schema && this.schema.$data, this.schemaValue = (0, qe.schemaRefOrVal)(t, this.schema, n, this.$data), this.schemaType = r.schemaType, this.parentSchema = t.schema, this.params = {}, this.it = t, this.def = r, this.$data)
      this.schemaCode = t.gen.const("vSchema", zo(this.$data, t));
    else if (this.schemaCode = this.schemaValue, !(0, Ut.validSchemaType)(this.schema, r.schemaType, r.allowUndefined))
      throw new Error(`${n} value must be ${JSON.stringify(r.schemaType)}`);
    ("code" in r ? r.trackErrors : r.errors !== !1) && (this.errsCount = t.gen.const("_errs", F.default.errors));
  }
  result(t, r, n) {
    this.failResult((0, D.not)(t), r, n);
  }
  failResult(t, r, n) {
    this.gen.if(t), n ? n() : this.error(), r ? (this.gen.else(), r(), this.allErrors && this.gen.endIf()) : this.allErrors ? this.gen.endIf() : this.gen.else();
  }
  pass(t, r) {
    this.failResult((0, D.not)(t), void 0, r);
  }
  fail(t) {
    if (t === void 0) {
      this.error(), this.allErrors || this.gen.if(!1);
      return;
    }
    this.gen.if(t), this.error(), this.allErrors ? this.gen.endIf() : this.gen.else();
  }
  fail$data(t) {
    if (!this.$data)
      return this.fail(t);
    const { schemaCode: r } = this;
    this.fail((0, D._)`${r} !== undefined && (${(0, D.or)(this.invalid$data(), t)})`);
  }
  error(t, r, n) {
    if (r) {
      this.setParams(r), this._error(t, n), this.setParams({});
      return;
    }
    this._error(t, n);
  }
  _error(t, r) {
    (t ? Lt.reportExtraError : Lt.reportError)(this, this.def.error, r);
  }
  $dataError() {
    (0, Lt.reportError)(this, this.def.$dataError || Lt.keyword$DataError);
  }
  reset() {
    if (this.errsCount === void 0)
      throw new Error('add "trackErrors" to keyword definition');
    (0, Lt.resetErrorsCount)(this.gen, this.errsCount);
  }
  ok(t) {
    this.allErrors || this.gen.if(t);
  }
  setParams(t, r) {
    r ? Object.assign(this.params, t) : this.params = t;
  }
  block$data(t, r, n = D.nil) {
    this.gen.block(() => {
      this.check$data(t, n), r();
    });
  }
  check$data(t = D.nil, r = D.nil) {
    if (!this.$data)
      return;
    const { gen: n, schemaCode: s, schemaType: a, def: o } = this;
    n.if((0, D.or)((0, D._)`${s} === undefined`, r)), t !== D.nil && n.assign(t, !0), (a.length || o.validateSchema) && (n.elseIf(this.invalid$data()), this.$dataError(), t !== D.nil && n.assign(t, !1)), n.else();
  }
  invalid$data() {
    const { gen: t, schemaCode: r, schemaType: n, def: s, it: a } = this;
    return (0, D.or)(o(), l());
    function o() {
      if (n.length) {
        if (!(r instanceof D.Name))
          throw new Error("ajv implementation error");
        const i = Array.isArray(n) ? n : [n];
        return (0, D._)`${(0, vr.checkDataTypes)(i, r, a.opts.strictNumbers, vr.DataType.Wrong)}`;
      }
      return D.nil;
    }
    function l() {
      if (s.validateSchema) {
        const i = t.scopeValue("validate$data", { ref: s.validateSchema });
        return (0, D._)`!${i}(${r})`;
      }
      return D.nil;
    }
  }
  subschema(t, r) {
    const n = (0, ln.getSubschema)(this.it, t);
    (0, ln.extendSubschemaData)(n, this.it, t), (0, ln.extendSubschemaMode)(n, t);
    const s = { ...this.it, ...n, items: void 0, props: void 0 };
    return bl(s, r), s;
  }
  mergeEvaluated(t, r) {
    const { it: n, gen: s } = this;
    n.opts.unevaluated && (n.props !== !0 && t.props !== void 0 && (n.props = qe.mergeEvaluated.props(s, t.props, n.props, r)), n.items !== !0 && t.items !== void 0 && (n.items = qe.mergeEvaluated.items(s, t.items, n.items, r)));
  }
  mergeValidEvaluated(t, r) {
    const { it: n, gen: s } = this;
    if (n.opts.unevaluated && (n.props !== !0 || n.items !== !0))
      return s.if(r, () => this.mergeEvaluated(t, D.Name)), !0;
  }
}
Pe.KeywordCxt = Mo;
function Vo(e, t, r, n) {
  const s = new Mo(e, r, t);
  "code" in r ? r.code(s, n) : s.$data && r.validate ? (0, Ut.funcKeywordCode)(s, r) : "macro" in r ? (0, Ut.macroKeywordCode)(s, r) : (r.compile || r.validate) && (0, Ut.funcKeywordCode)(s, r);
}
const Vl = /^\/(?:[^~]|~0|~1)*$/, zl = /^([0-9]+)(#|\/(?:[^~]|~0|~1)*)?$/;
function zo(e, { dataLevel: t, dataNames: r, dataPathArr: n }) {
  let s, a;
  if (e === "")
    return F.default.rootData;
  if (e[0] === "/") {
    if (!Vl.test(e))
      throw new Error(`Invalid JSON-pointer: ${e}`);
    s = e, a = F.default.rootData;
  } else {
    const d = zl.exec(e);
    if (!d)
      throw new Error(`Invalid JSON-pointer: ${e}`);
    const c = +d[1];
    if (s = d[2], s === "#") {
      if (c >= t)
        throw new Error(i("property/index", c));
      return n[t - c];
    }
    if (c > t)
      throw new Error(i("data", c));
    if (a = r[t - c], !s)
      return a;
  }
  let o = a;
  const l = s.split("/");
  for (const d of l)
    d && (a = (0, D._)`${a}${(0, D.getProperty)((0, qe.unescapeJsonPointer)(d))}`, o = (0, D._)`${o} && ${a}`);
  return o;
  function i(d, c) {
    return `Cannot access ${d} ${c} levels up, current level is ${t}`;
  }
}
Pe.getData = zo;
var Nt = {};
Object.defineProperty(Nt, "__esModule", { value: !0 });
class Fl extends Error {
  constructor(t) {
    super("validation failed"), this.errors = t, this.ajv = this.validation = !0;
  }
}
Nt.default = Fl;
var $t = {};
Object.defineProperty($t, "__esModule", { value: !0 });
const un = ce;
class Ul extends Error {
  constructor(t, r, n, s) {
    super(s || `can't resolve reference ${n} from id ${r}`), this.missingRef = (0, un.resolveUrl)(t, r, n), this.missingSchema = (0, un.normalizeId)((0, un.getFullPath)(t, this.missingRef));
  }
}
$t.default = Ul;
var me = {};
Object.defineProperty(me, "__esModule", { value: !0 });
me.resolveSchema = me.getCompilingSchema = me.resolveRef = me.compileSchema = me.SchemaEnv = void 0;
const Ie = U, ql = Nt, at = Ee, Te = ce, la = T, Gl = Pe;
class Nr {
  constructor(t) {
    var r;
    this.refs = {}, this.dynamicAnchors = {};
    let n;
    typeof t.schema == "object" && (n = t.schema), this.schema = t.schema, this.schemaId = t.schemaId, this.root = t.root || this, this.baseId = (r = t.baseId) !== null && r !== void 0 ? r : (0, Te.normalizeId)(n == null ? void 0 : n[t.schemaId || "$id"]), this.schemaPath = t.schemaPath, this.localRefs = t.localRefs, this.meta = t.meta, this.$async = n == null ? void 0 : n.$async, this.refs = {};
  }
}
me.SchemaEnv = Nr;
function Jn(e) {
  const t = Fo.call(this, e);
  if (t)
    return t;
  const r = (0, Te.getFullPath)(this.opts.uriResolver, e.root.baseId), { es5: n, lines: s } = this.opts.code, { ownProperties: a } = this.opts, o = new Ie.CodeGen(this.scope, { es5: n, lines: s, ownProperties: a });
  let l;
  e.$async && (l = o.scopeValue("Error", {
    ref: ql.default,
    code: (0, Ie._)`require("ajv/dist/runtime/validation_error").default`
  }));
  const i = o.scopeName("validate");
  e.validateName = i;
  const d = {
    gen: o,
    allErrors: this.opts.allErrors,
    data: at.default.data,
    parentData: at.default.parentData,
    parentDataProperty: at.default.parentDataProperty,
    dataNames: [at.default.data],
    dataPathArr: [Ie.nil],
    // TODO can its length be used as dataLevel if nil is removed?
    dataLevel: 0,
    dataTypes: [],
    definedProperties: /* @__PURE__ */ new Set(),
    topSchemaRef: o.scopeValue("schema", this.opts.code.source === !0 ? { ref: e.schema, code: (0, Ie.stringify)(e.schema) } : { ref: e.schema }),
    validateName: i,
    ValidationError: l,
    schema: e.schema,
    schemaEnv: e,
    rootId: r,
    baseId: e.baseId || r,
    schemaPath: Ie.nil,
    errSchemaPath: e.schemaPath || (this.opts.jtd ? "" : "#"),
    errorPath: (0, Ie._)`""`,
    opts: this.opts,
    self: this
  };
  let c;
  try {
    this._compilations.add(e), (0, Gl.validateFunctionCode)(d), o.optimize(this.opts.code.optimize);
    const f = o.toString();
    c = `${o.scopeRefs(at.default.scope)}return ${f}`, this.opts.code.process && (c = this.opts.code.process(c, e));
    const $ = new Function(`${at.default.self}`, `${at.default.scope}`, c)(this, this.scope.get());
    if (this.scope.value(i, { ref: $ }), $.errors = null, $.schema = e.schema, $.schemaEnv = e, e.$async && ($.$async = !0), this.opts.code.source === !0 && ($.source = { validateName: i, validateCode: f, scopeValues: o._values }), this.opts.unevaluated) {
      const { props: E, items: y } = d;
      $.evaluated = {
        props: E instanceof Ie.Name ? void 0 : E,
        items: y instanceof Ie.Name ? void 0 : y,
        dynamicProps: E instanceof Ie.Name,
        dynamicItems: y instanceof Ie.Name
      }, $.source && ($.source.evaluated = (0, Ie.stringify)($.evaluated));
    }
    return e.validate = $, e;
  } catch (f) {
    throw delete e.validate, delete e.validateName, c && this.logger.error("Error compiling schema, function code:", c), f;
  } finally {
    this._compilations.delete(e);
  }
}
me.compileSchema = Jn;
function Kl(e, t, r) {
  var n;
  r = (0, Te.resolveUrl)(this.opts.uriResolver, t, r);
  const s = e.refs[r];
  if (s)
    return s;
  let a = Wl.call(this, e, r);
  if (a === void 0) {
    const o = (n = e.localRefs) === null || n === void 0 ? void 0 : n[r], { schemaId: l } = this.opts;
    o && (a = new Nr({ schema: o, schemaId: l, root: e, baseId: t }));
  }
  if (a !== void 0)
    return e.refs[r] = Hl.call(this, a);
}
me.resolveRef = Kl;
function Hl(e) {
  return (0, Te.inlineRef)(e.schema, this.opts.inlineRefs) ? e.schema : e.validate ? e : Jn.call(this, e);
}
function Fo(e) {
  for (const t of this._compilations)
    if (Xl(t, e))
      return t;
}
me.getCompilingSchema = Fo;
function Xl(e, t) {
  return e.schema === t.schema && e.root === t.root && e.baseId === t.baseId;
}
function Wl(e, t) {
  let r;
  for (; typeof (r = this.refs[t]) == "string"; )
    t = r;
  return r || this.schemas[t] || Or.call(this, e, t);
}
function Or(e, t) {
  const r = this.opts.uriResolver.parse(t), n = (0, Te._getFullPath)(this.opts.uriResolver, r);
  let s = (0, Te.getFullPath)(this.opts.uriResolver, e.baseId, void 0);
  if (Object.keys(e.schema).length > 0 && n === s)
    return dn.call(this, r, e);
  const a = (0, Te.normalizeId)(n), o = this.refs[a] || this.schemas[a];
  if (typeof o == "string") {
    const l = Or.call(this, e, o);
    return typeof (l == null ? void 0 : l.schema) != "object" ? void 0 : dn.call(this, r, l);
  }
  if (typeof (o == null ? void 0 : o.schema) == "object") {
    if (o.validate || Jn.call(this, o), a === (0, Te.normalizeId)(t)) {
      const { schema: l } = o, { schemaId: i } = this.opts, d = l[i];
      return d && (s = (0, Te.resolveUrl)(this.opts.uriResolver, s, d)), new Nr({ schema: l, schemaId: i, root: e, baseId: s });
    }
    return dn.call(this, r, o);
  }
}
me.resolveSchema = Or;
const Bl = /* @__PURE__ */ new Set([
  "properties",
  "patternProperties",
  "enum",
  "dependencies",
  "definitions"
]);
function dn(e, { baseId: t, schema: r, root: n }) {
  var s;
  if (((s = e.fragment) === null || s === void 0 ? void 0 : s[0]) !== "/")
    return;
  for (const l of e.fragment.slice(1).split("/")) {
    if (typeof r == "boolean")
      return;
    const i = r[(0, la.unescapeFragment)(l)];
    if (i === void 0)
      return;
    r = i;
    const d = typeof r == "object" && r[this.opts.schemaId];
    !Bl.has(l) && d && (t = (0, Te.resolveUrl)(this.opts.uriResolver, t, d));
  }
  let a;
  if (typeof r != "boolean" && r.$ref && !(0, la.schemaHasRulesButRef)(r, this.RULES)) {
    const l = (0, Te.resolveUrl)(this.opts.uriResolver, t, r.$ref);
    a = Or.call(this, n, l);
  }
  const { schemaId: o } = this.opts;
  if (a = a || new Nr({ schema: r, schemaId: o, root: n, baseId: t }), a.schema !== a.root.schema)
    return a;
}
const xl = "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#", Jl = "Meta-schema for $data reference (JSON AnySchema extension proposal)", Yl = "object", Zl = [
  "$data"
], Ql = {
  $data: {
    type: "string",
    anyOf: [
      {
        format: "relative-json-pointer"
      },
      {
        format: "json-pointer"
      }
    ]
  }
}, eu = !1, tu = {
  $id: xl,
  description: Jl,
  type: Yl,
  required: Zl,
  properties: Ql,
  additionalProperties: eu
};
var Yn = {}, Tr = { exports: {} };
const ru = RegExp.prototype.test.bind(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/iu), Uo = RegExp.prototype.test.bind(/^(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)$/u);
function qo(e) {
  let t = "", r = 0, n = 0;
  for (n = 0; n < e.length; n++)
    if (r = e[n].charCodeAt(0), r !== 48) {
      if (!(r >= 48 && r <= 57 || r >= 65 && r <= 70 || r >= 97 && r <= 102))
        return "";
      t += e[n];
      break;
    }
  for (n += 1; n < e.length; n++) {
    if (r = e[n].charCodeAt(0), !(r >= 48 && r <= 57 || r >= 65 && r <= 70 || r >= 97 && r <= 102))
      return "";
    t += e[n];
  }
  return t;
}
const nu = RegExp.prototype.test.bind(/[^!"$&'()*+,\-.;=_`a-z{}~]/u);
function ua(e) {
  return e.length = 0, !0;
}
function su(e, t, r) {
  if (e.length) {
    const n = qo(e);
    if (n !== "")
      t.push(n);
    else
      return r.error = !0, !1;
    e.length = 0;
  }
  return !0;
}
function au(e) {
  let t = 0;
  const r = { error: !1, address: "", zone: "" }, n = [], s = [];
  let a = !1, o = !1, l = su;
  for (let i = 0; i < e.length; i++) {
    const d = e[i];
    if (!(d === "[" || d === "]"))
      if (d === ":") {
        if (a === !0 && (o = !0), !l(s, n, r))
          break;
        if (++t > 7) {
          r.error = !0;
          break;
        }
        i > 0 && e[i - 1] === ":" && (a = !0), n.push(":");
        continue;
      } else if (d === "%") {
        if (!l(s, n, r))
          break;
        l = ua;
      } else {
        s.push(d);
        continue;
      }
  }
  return s.length && (l === ua ? r.zone = s.join("") : o ? n.push(s.join("")) : n.push(qo(s))), r.address = n.join(""), r;
}
function Go(e) {
  if (ou(e, ":") < 2)
    return { host: e, isIPV6: !1 };
  const t = au(e);
  if (t.error)
    return { host: e, isIPV6: !1 };
  {
    let r = t.address, n = t.address;
    return t.zone && (r += "%" + t.zone, n += "%25" + t.zone), { host: r, isIPV6: !0, escapedHost: n };
  }
}
function ou(e, t) {
  let r = 0;
  for (let n = 0; n < e.length; n++)
    e[n] === t && r++;
  return r;
}
function iu(e) {
  let t = e;
  const r = [];
  let n = -1, s = 0;
  for (; s = t.length; ) {
    if (s === 1) {
      if (t === ".")
        break;
      if (t === "/") {
        r.push("/");
        break;
      } else {
        r.push(t);
        break;
      }
    } else if (s === 2) {
      if (t[0] === ".") {
        if (t[1] === ".")
          break;
        if (t[1] === "/") {
          t = t.slice(2);
          continue;
        }
      } else if (t[0] === "/" && (t[1] === "." || t[1] === "/")) {
        r.push("/");
        break;
      }
    } else if (s === 3 && t === "/..") {
      r.length !== 0 && r.pop(), r.push("/");
      break;
    }
    if (t[0] === ".") {
      if (t[1] === ".") {
        if (t[2] === "/") {
          t = t.slice(3);
          continue;
        }
      } else if (t[1] === "/") {
        t = t.slice(2);
        continue;
      }
    } else if (t[0] === "/" && t[1] === ".") {
      if (t[2] === "/") {
        t = t.slice(2);
        continue;
      } else if (t[2] === "." && t[3] === "/") {
        t = t.slice(3), r.length !== 0 && r.pop();
        continue;
      }
    }
    if ((n = t.indexOf("/", 1)) === -1) {
      r.push(t);
      break;
    } else
      r.push(t.slice(0, n)), t = t.slice(n);
  }
  return r.join("");
}
function cu(e, t) {
  const r = t !== !0 ? escape : unescape;
  return e.scheme !== void 0 && (e.scheme = r(e.scheme)), e.userinfo !== void 0 && (e.userinfo = r(e.userinfo)), e.host !== void 0 && (e.host = r(e.host)), e.path !== void 0 && (e.path = r(e.path)), e.query !== void 0 && (e.query = r(e.query)), e.fragment !== void 0 && (e.fragment = r(e.fragment)), e;
}
function lu(e) {
  const t = [];
  if (e.userinfo !== void 0 && (t.push(e.userinfo), t.push("@")), e.host !== void 0) {
    let r = unescape(e.host);
    if (!Uo(r)) {
      const n = Go(r);
      n.isIPV6 === !0 ? r = `[${n.escapedHost}]` : r = e.host;
    }
    t.push(r);
  }
  return (typeof e.port == "number" || typeof e.port == "string") && (t.push(":"), t.push(String(e.port))), t.length ? t.join("") : void 0;
}
var Ko = {
  nonSimpleDomain: nu,
  recomposeAuthority: lu,
  normalizeComponentEncoding: cu,
  removeDotSegments: iu,
  isIPv4: Uo,
  isUUID: ru,
  normalizeIPv6: Go
};
const { isUUID: uu } = Ko, du = /([\da-z][\d\-a-z]{0,31}):((?:[\w!$'()*+,\-.:;=@]|%[\da-f]{2})+)/iu;
function Ho(e) {
  return e.secure === !0 ? !0 : e.secure === !1 ? !1 : e.scheme ? e.scheme.length === 3 && (e.scheme[0] === "w" || e.scheme[0] === "W") && (e.scheme[1] === "s" || e.scheme[1] === "S") && (e.scheme[2] === "s" || e.scheme[2] === "S") : !1;
}
function Xo(e) {
  return e.host || (e.error = e.error || "HTTP URIs must have a host."), e;
}
function Wo(e) {
  const t = String(e.scheme).toLowerCase() === "https";
  return (e.port === (t ? 443 : 80) || e.port === "") && (e.port = void 0), e.path || (e.path = "/"), e;
}
function fu(e) {
  return e.secure = Ho(e), e.resourceName = (e.path || "/") + (e.query ? "?" + e.query : ""), e.path = void 0, e.query = void 0, e;
}
function hu(e) {
  if ((e.port === (Ho(e) ? 443 : 80) || e.port === "") && (e.port = void 0), typeof e.secure == "boolean" && (e.scheme = e.secure ? "wss" : "ws", e.secure = void 0), e.resourceName) {
    const [t, r] = e.resourceName.split("?");
    e.path = t && t !== "/" ? t : void 0, e.query = r, e.resourceName = void 0;
  }
  return e.fragment = void 0, e;
}
function mu(e, t) {
  if (!e.path)
    return e.error = "URN can not be parsed", e;
  const r = e.path.match(du);
  if (r) {
    const n = t.scheme || e.scheme || "urn";
    e.nid = r[1].toLowerCase(), e.nss = r[2];
    const s = `${n}:${t.nid || e.nid}`, a = Zn(s);
    e.path = void 0, a && (e = a.parse(e, t));
  } else
    e.error = e.error || "URN can not be parsed.";
  return e;
}
function pu(e, t) {
  if (e.nid === void 0)
    throw new Error("URN without nid cannot be serialized");
  const r = t.scheme || e.scheme || "urn", n = e.nid.toLowerCase(), s = `${r}:${t.nid || n}`, a = Zn(s);
  a && (e = a.serialize(e, t));
  const o = e, l = e.nss;
  return o.path = `${n || t.nid}:${l}`, t.skipEscape = !0, o;
}
function $u(e, t) {
  const r = e;
  return r.uuid = r.nss, r.nss = void 0, !t.tolerant && (!r.uuid || !uu(r.uuid)) && (r.error = r.error || "UUID is not valid."), r;
}
function yu(e) {
  const t = e;
  return t.nss = (e.uuid || "").toLowerCase(), t;
}
const Bo = (
  /** @type {SchemeHandler} */
  {
    scheme: "http",
    domainHost: !0,
    parse: Xo,
    serialize: Wo
  }
), gu = (
  /** @type {SchemeHandler} */
  {
    scheme: "https",
    domainHost: Bo.domainHost,
    parse: Xo,
    serialize: Wo
  }
), hr = (
  /** @type {SchemeHandler} */
  {
    scheme: "ws",
    domainHost: !0,
    parse: fu,
    serialize: hu
  }
), vu = (
  /** @type {SchemeHandler} */
  {
    scheme: "wss",
    domainHost: hr.domainHost,
    parse: hr.parse,
    serialize: hr.serialize
  }
), _u = (
  /** @type {SchemeHandler} */
  {
    scheme: "urn",
    parse: mu,
    serialize: pu,
    skipNormalize: !0
  }
), Eu = (
  /** @type {SchemeHandler} */
  {
    scheme: "urn:uuid",
    parse: $u,
    serialize: yu,
    skipNormalize: !0
  }
), _r = (
  /** @type {Record<SchemeName, SchemeHandler>} */
  {
    http: Bo,
    https: gu,
    ws: hr,
    wss: vu,
    urn: _u,
    "urn:uuid": Eu
  }
);
Object.setPrototypeOf(_r, null);
function Zn(e) {
  return e && (_r[
    /** @type {SchemeName} */
    e
  ] || _r[
    /** @type {SchemeName} */
    e.toLowerCase()
  ]) || void 0;
}
var wu = {
  SCHEMES: _r,
  getSchemeHandler: Zn
};
const { normalizeIPv6: Su, removeDotSegments: zt, recomposeAuthority: bu, normalizeComponentEncoding: Yt, isIPv4: Pu, nonSimpleDomain: Ru } = Ko, { SCHEMES: Iu, getSchemeHandler: xo } = wu;
function Nu(e, t) {
  return typeof e == "string" ? e = /** @type {T} */
  Ve(Ge(e, t), t) : typeof e == "object" && (e = /** @type {T} */
  Ge(Ve(e, t), t)), e;
}
function Ou(e, t, r) {
  const n = r ? Object.assign({ scheme: "null" }, r) : { scheme: "null" }, s = Jo(Ge(e, n), Ge(t, n), n, !0);
  return n.skipEscape = !0, Ve(s, n);
}
function Jo(e, t, r, n) {
  const s = {};
  return n || (e = Ge(Ve(e, r), r), t = Ge(Ve(t, r), r)), r = r || {}, !r.tolerant && t.scheme ? (s.scheme = t.scheme, s.userinfo = t.userinfo, s.host = t.host, s.port = t.port, s.path = zt(t.path || ""), s.query = t.query) : (t.userinfo !== void 0 || t.host !== void 0 || t.port !== void 0 ? (s.userinfo = t.userinfo, s.host = t.host, s.port = t.port, s.path = zt(t.path || ""), s.query = t.query) : (t.path ? (t.path[0] === "/" ? s.path = zt(t.path) : ((e.userinfo !== void 0 || e.host !== void 0 || e.port !== void 0) && !e.path ? s.path = "/" + t.path : e.path ? s.path = e.path.slice(0, e.path.lastIndexOf("/") + 1) + t.path : s.path = t.path, s.path = zt(s.path)), s.query = t.query) : (s.path = e.path, t.query !== void 0 ? s.query = t.query : s.query = e.query), s.userinfo = e.userinfo, s.host = e.host, s.port = e.port), s.scheme = e.scheme), s.fragment = t.fragment, s;
}
function Tu(e, t, r) {
  return typeof e == "string" ? (e = unescape(e), e = Ve(Yt(Ge(e, r), !0), { ...r, skipEscape: !0 })) : typeof e == "object" && (e = Ve(Yt(e, !0), { ...r, skipEscape: !0 })), typeof t == "string" ? (t = unescape(t), t = Ve(Yt(Ge(t, r), !0), { ...r, skipEscape: !0 })) : typeof t == "object" && (t = Ve(Yt(t, !0), { ...r, skipEscape: !0 })), e.toLowerCase() === t.toLowerCase();
}
function Ve(e, t) {
  const r = {
    host: e.host,
    scheme: e.scheme,
    userinfo: e.userinfo,
    port: e.port,
    path: e.path,
    query: e.query,
    nid: e.nid,
    nss: e.nss,
    uuid: e.uuid,
    fragment: e.fragment,
    reference: e.reference,
    resourceName: e.resourceName,
    secure: e.secure,
    error: ""
  }, n = Object.assign({}, t), s = [], a = xo(n.scheme || r.scheme);
  a && a.serialize && a.serialize(r, n), r.path !== void 0 && (n.skipEscape ? r.path = unescape(r.path) : (r.path = escape(r.path), r.scheme !== void 0 && (r.path = r.path.split("%3A").join(":")))), n.reference !== "suffix" && r.scheme && s.push(r.scheme, ":");
  const o = bu(r);
  if (o !== void 0 && (n.reference !== "suffix" && s.push("//"), s.push(o), r.path && r.path[0] !== "/" && s.push("/")), r.path !== void 0) {
    let l = r.path;
    !n.absolutePath && (!a || !a.absolutePath) && (l = zt(l)), o === void 0 && l[0] === "/" && l[1] === "/" && (l = "/%2F" + l.slice(2)), s.push(l);
  }
  return r.query !== void 0 && s.push("?", r.query), r.fragment !== void 0 && s.push("#", r.fragment), s.join("");
}
const ju = /^(?:([^#/:?]+):)?(?:\/\/((?:([^#/?@]*)@)?(\[[^#/?\]]+\]|[^#/:?]*)(?::(\d*))?))?([^#?]*)(?:\?([^#]*))?(?:#((?:.|[\n\r])*))?/u;
function Ge(e, t) {
  const r = Object.assign({}, t), n = {
    scheme: void 0,
    userinfo: void 0,
    host: "",
    port: void 0,
    path: "",
    query: void 0,
    fragment: void 0
  };
  let s = !1;
  r.reference === "suffix" && (r.scheme ? e = r.scheme + ":" + e : e = "//" + e);
  const a = e.match(ju);
  if (a) {
    if (n.scheme = a[1], n.userinfo = a[3], n.host = a[4], n.port = parseInt(a[5], 10), n.path = a[6] || "", n.query = a[7], n.fragment = a[8], isNaN(n.port) && (n.port = a[5]), n.host)
      if (Pu(n.host) === !1) {
        const i = Su(n.host);
        n.host = i.host.toLowerCase(), s = i.isIPV6;
      } else
        s = !0;
    n.scheme === void 0 && n.userinfo === void 0 && n.host === void 0 && n.port === void 0 && n.query === void 0 && !n.path ? n.reference = "same-document" : n.scheme === void 0 ? n.reference = "relative" : n.fragment === void 0 ? n.reference = "absolute" : n.reference = "uri", r.reference && r.reference !== "suffix" && r.reference !== n.reference && (n.error = n.error || "URI is not a " + r.reference + " reference.");
    const o = xo(r.scheme || n.scheme);
    if (!r.unicodeSupport && (!o || !o.unicodeSupport) && n.host && (r.domainHost || o && o.domainHost) && s === !1 && Ru(n.host))
      try {
        n.host = URL.domainToASCII(n.host.toLowerCase());
      } catch (l) {
        n.error = n.error || "Host's domain name can not be converted to ASCII: " + l;
      }
    (!o || o && !o.skipNormalize) && (e.indexOf("%") !== -1 && (n.scheme !== void 0 && (n.scheme = unescape(n.scheme)), n.host !== void 0 && (n.host = unescape(n.host))), n.path && (n.path = escape(unescape(n.path))), n.fragment && (n.fragment = encodeURI(decodeURIComponent(n.fragment)))), o && o.parse && o.parse(n, r);
  } else
    n.error = n.error || "URI can not be parsed.";
  return n;
}
const Qn = {
  SCHEMES: Iu,
  normalize: Nu,
  resolve: Ou,
  resolveComponent: Jo,
  equal: Tu,
  serialize: Ve,
  parse: Ge
};
Tr.exports = Qn;
Tr.exports.default = Qn;
Tr.exports.fastUri = Qn;
var Au = Tr.exports;
Object.defineProperty(Yn, "__esModule", { value: !0 });
const Yo = Au;
Yo.code = 'require("ajv/dist/runtime/uri").default';
Yn.default = Yo;
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.CodeGen = e.Name = e.nil = e.stringify = e.str = e._ = e.KeywordCxt = void 0;
  var t = Pe;
  Object.defineProperty(e, "KeywordCxt", { enumerable: !0, get: function() {
    return t.KeywordCxt;
  } });
  var r = U;
  Object.defineProperty(e, "_", { enumerable: !0, get: function() {
    return r._;
  } }), Object.defineProperty(e, "str", { enumerable: !0, get: function() {
    return r.str;
  } }), Object.defineProperty(e, "stringify", { enumerable: !0, get: function() {
    return r.stringify;
  } }), Object.defineProperty(e, "nil", { enumerable: !0, get: function() {
    return r.nil;
  } }), Object.defineProperty(e, "Name", { enumerable: !0, get: function() {
    return r.Name;
  } }), Object.defineProperty(e, "CodeGen", { enumerable: !0, get: function() {
    return r.CodeGen;
  } });
  const n = Nt, s = $t, a = ht, o = me, l = U, i = ce, d = se, c = T, f = tu, _ = Yn, $ = (P, p) => new RegExp(P, p);
  $.code = "new RegExp";
  const E = ["removeAdditional", "useDefaults", "coerceTypes"], y = /* @__PURE__ */ new Set([
    "validate",
    "serialize",
    "parse",
    "wrapper",
    "root",
    "schema",
    "keyword",
    "pattern",
    "formats",
    "validate$data",
    "func",
    "obj",
    "Error"
  ]), v = {
    errorDataPath: "",
    format: "`validateFormats: false` can be used instead.",
    nullable: '"nullable" keyword is supported by default.',
    jsonPointers: "Deprecated jsPropertySyntax can be used instead.",
    extendRefs: "Deprecated ignoreKeywordsWithRef can be used instead.",
    missingRefs: "Pass empty schema with $id that should be ignored to ajv.addSchema.",
    processCode: "Use option `code: {process: (code, schemaEnv: object) => string}`",
    sourceCode: "Use option `code: {source: true}`",
    strictDefaults: "It is default now, see option `strict`.",
    strictKeywords: "It is default now, see option `strict`.",
    uniqueItems: '"uniqueItems" keyword is always validated.',
    unknownFormats: "Disable strict mode or pass `true` to `ajv.addFormat` (or `formats` option).",
    cache: "Map is used as cache, schema object as key.",
    serialize: "Map is used as cache, schema object as key.",
    ajvErrors: "It is default now."
  }, m = {
    ignoreKeywordsWithRef: "",
    jsPropertySyntax: "",
    unicode: '"minLength"/"maxLength" account for unicode characters by default.'
  }, w = 200;
  function R(P) {
    var p, S, g, u, h, b, L, M, J, B, ae, gt, Kr, Hr, Xr, Wr, Br, xr, Jr, Yr, Zr, Qr, en, tn, rn;
    const Ct = P.strict, nn = (p = P.code) === null || p === void 0 ? void 0 : p.optimize, Xs = nn === !0 || nn === void 0 ? 1 : nn || 0, Ws = (g = (S = P.code) === null || S === void 0 ? void 0 : S.regExp) !== null && g !== void 0 ? g : $, Oi = (u = P.uriResolver) !== null && u !== void 0 ? u : _.default;
    return {
      strictSchema: (b = (h = P.strictSchema) !== null && h !== void 0 ? h : Ct) !== null && b !== void 0 ? b : !0,
      strictNumbers: (M = (L = P.strictNumbers) !== null && L !== void 0 ? L : Ct) !== null && M !== void 0 ? M : !0,
      strictTypes: (B = (J = P.strictTypes) !== null && J !== void 0 ? J : Ct) !== null && B !== void 0 ? B : "log",
      strictTuples: (gt = (ae = P.strictTuples) !== null && ae !== void 0 ? ae : Ct) !== null && gt !== void 0 ? gt : "log",
      strictRequired: (Hr = (Kr = P.strictRequired) !== null && Kr !== void 0 ? Kr : Ct) !== null && Hr !== void 0 ? Hr : !1,
      code: P.code ? { ...P.code, optimize: Xs, regExp: Ws } : { optimize: Xs, regExp: Ws },
      loopRequired: (Xr = P.loopRequired) !== null && Xr !== void 0 ? Xr : w,
      loopEnum: (Wr = P.loopEnum) !== null && Wr !== void 0 ? Wr : w,
      meta: (Br = P.meta) !== null && Br !== void 0 ? Br : !0,
      messages: (xr = P.messages) !== null && xr !== void 0 ? xr : !0,
      inlineRefs: (Jr = P.inlineRefs) !== null && Jr !== void 0 ? Jr : !0,
      schemaId: (Yr = P.schemaId) !== null && Yr !== void 0 ? Yr : "$id",
      addUsedSchema: (Zr = P.addUsedSchema) !== null && Zr !== void 0 ? Zr : !0,
      validateSchema: (Qr = P.validateSchema) !== null && Qr !== void 0 ? Qr : !0,
      validateFormats: (en = P.validateFormats) !== null && en !== void 0 ? en : !0,
      unicodeRegExp: (tn = P.unicodeRegExp) !== null && tn !== void 0 ? tn : !0,
      int32range: (rn = P.int32range) !== null && rn !== void 0 ? rn : !0,
      uriResolver: Oi
    };
  }
  class O {
    constructor(p = {}) {
      this.schemas = {}, this.refs = {}, this.formats = {}, this._compilations = /* @__PURE__ */ new Set(), this._loading = {}, this._cache = /* @__PURE__ */ new Map(), p = this.opts = { ...p, ...R(p) };
      const { es5: S, lines: g } = this.opts.code;
      this.scope = new l.ValueScope({ scope: {}, prefixes: y, es5: S, lines: g }), this.logger = K(p.logger);
      const u = p.validateFormats;
      p.validateFormats = !1, this.RULES = (0, a.getRules)(), j.call(this, v, p, "NOT SUPPORTED"), j.call(this, m, p, "DEPRECATED", "warn"), this._metaOpts = Re.call(this), p.formats && $e.call(this), this._addVocabularies(), this._addDefaultMetaSchema(), p.keywords && we.call(this, p.keywords), typeof p.meta == "object" && this.addMetaSchema(p.meta), te.call(this), p.validateFormats = u;
    }
    _addVocabularies() {
      this.addKeyword("$async");
    }
    _addDefaultMetaSchema() {
      const { $data: p, meta: S, schemaId: g } = this.opts;
      let u = f;
      g === "id" && (u = { ...f }, u.id = u.$id, delete u.$id), S && p && this.addMetaSchema(u, u[g], !1);
    }
    defaultMeta() {
      const { meta: p, schemaId: S } = this.opts;
      return this.opts.defaultMeta = typeof p == "object" ? p[S] || p : void 0;
    }
    validate(p, S) {
      let g;
      if (typeof p == "string") {
        if (g = this.getSchema(p), !g)
          throw new Error(`no schema with key or ref "${p}"`);
      } else
        g = this.compile(p);
      const u = g(S);
      return "$async" in g || (this.errors = g.errors), u;
    }
    compile(p, S) {
      const g = this._addSchema(p, S);
      return g.validate || this._compileSchemaEnv(g);
    }
    compileAsync(p, S) {
      if (typeof this.opts.loadSchema != "function")
        throw new Error("options.loadSchema should be a function");
      const { loadSchema: g } = this.opts;
      return u.call(this, p, S);
      async function u(B, ae) {
        await h.call(this, B.$schema);
        const gt = this._addSchema(B, ae);
        return gt.validate || b.call(this, gt);
      }
      async function h(B) {
        B && !this.getSchema(B) && await u.call(this, { $ref: B }, !0);
      }
      async function b(B) {
        try {
          return this._compileSchemaEnv(B);
        } catch (ae) {
          if (!(ae instanceof s.default))
            throw ae;
          return L.call(this, ae), await M.call(this, ae.missingSchema), b.call(this, B);
        }
      }
      function L({ missingSchema: B, missingRef: ae }) {
        if (this.refs[B])
          throw new Error(`AnySchema ${B} is loaded but ${ae} cannot be resolved`);
      }
      async function M(B) {
        const ae = await J.call(this, B);
        this.refs[B] || await h.call(this, ae.$schema), this.refs[B] || this.addSchema(ae, B, S);
      }
      async function J(B) {
        const ae = this._loading[B];
        if (ae)
          return ae;
        try {
          return await (this._loading[B] = g(B));
        } finally {
          delete this._loading[B];
        }
      }
    }
    // Adds schema to the instance
    addSchema(p, S, g, u = this.opts.validateSchema) {
      if (Array.isArray(p)) {
        for (const b of p)
          this.addSchema(b, void 0, g, u);
        return this;
      }
      let h;
      if (typeof p == "object") {
        const { schemaId: b } = this.opts;
        if (h = p[b], h !== void 0 && typeof h != "string")
          throw new Error(`schema ${b} must be string`);
      }
      return S = (0, i.normalizeId)(S || h), this._checkUnique(S), this.schemas[S] = this._addSchema(p, g, S, u, !0), this;
    }
    // Add schema that will be used to validate other schemas
    // options in META_IGNORE_OPTIONS are alway set to false
    addMetaSchema(p, S, g = this.opts.validateSchema) {
      return this.addSchema(p, S, !0, g), this;
    }
    //  Validate schema against its meta-schema
    validateSchema(p, S) {
      if (typeof p == "boolean")
        return !0;
      let g;
      if (g = p.$schema, g !== void 0 && typeof g != "string")
        throw new Error("$schema must be a string");
      if (g = g || this.opts.defaultMeta || this.defaultMeta(), !g)
        return this.logger.warn("meta-schema not available"), this.errors = null, !0;
      const u = this.validate(g, p);
      if (!u && S) {
        const h = "schema is invalid: " + this.errorsText();
        if (this.opts.validateSchema === "log")
          this.logger.error(h);
        else
          throw new Error(h);
      }
      return u;
    }
    // Get compiled schema by `key` or `ref`.
    // (`key` that was passed to `addSchema` or full schema reference - `schema.$id` or resolved id)
    getSchema(p) {
      let S;
      for (; typeof (S = x.call(this, p)) == "string"; )
        p = S;
      if (S === void 0) {
        const { schemaId: g } = this.opts, u = new o.SchemaEnv({ schema: {}, schemaId: g });
        if (S = o.resolveSchema.call(this, u, p), !S)
          return;
        this.refs[p] = S;
      }
      return S.validate || this._compileSchemaEnv(S);
    }
    // Remove cached schema(s).
    // If no parameter is passed all schemas but meta-schemas are removed.
    // If RegExp is passed all schemas with key/id matching pattern but meta-schemas are removed.
    // Even if schema is referenced by other schemas it still can be removed as other schemas have local references.
    removeSchema(p) {
      if (p instanceof RegExp)
        return this._removeAllSchemas(this.schemas, p), this._removeAllSchemas(this.refs, p), this;
      switch (typeof p) {
        case "undefined":
          return this._removeAllSchemas(this.schemas), this._removeAllSchemas(this.refs), this._cache.clear(), this;
        case "string": {
          const S = x.call(this, p);
          return typeof S == "object" && this._cache.delete(S.schema), delete this.schemas[p], delete this.refs[p], this;
        }
        case "object": {
          const S = p;
          this._cache.delete(S);
          let g = p[this.opts.schemaId];
          return g && (g = (0, i.normalizeId)(g), delete this.schemas[g], delete this.refs[g]), this;
        }
        default:
          throw new Error("ajv.removeSchema: invalid parameter");
      }
    }
    // add "vocabulary" - a collection of keywords
    addVocabulary(p) {
      for (const S of p)
        this.addKeyword(S);
      return this;
    }
    addKeyword(p, S) {
      let g;
      if (typeof p == "string")
        g = p, typeof S == "object" && (this.logger.warn("these parameters are deprecated, see docs for addKeyword"), S.keyword = g);
      else if (typeof p == "object" && S === void 0) {
        if (S = p, g = S.keyword, Array.isArray(g) && !g.length)
          throw new Error("addKeywords: keyword must be string or non-empty array");
      } else
        throw new Error("invalid addKeywords parameters");
      if (I.call(this, g, S), !S)
        return (0, c.eachItem)(g, (h) => N.call(this, h)), this;
      A.call(this, S);
      const u = {
        ...S,
        type: (0, d.getJSONTypes)(S.type),
        schemaType: (0, d.getJSONTypes)(S.schemaType)
      };
      return (0, c.eachItem)(g, u.type.length === 0 ? (h) => N.call(this, h, u) : (h) => u.type.forEach((b) => N.call(this, h, u, b))), this;
    }
    getKeyword(p) {
      const S = this.RULES.all[p];
      return typeof S == "object" ? S.definition : !!S;
    }
    // Remove keyword
    removeKeyword(p) {
      const { RULES: S } = this;
      delete S.keywords[p], delete S.all[p];
      for (const g of S.rules) {
        const u = g.rules.findIndex((h) => h.keyword === p);
        u >= 0 && g.rules.splice(u, 1);
      }
      return this;
    }
    // Add format
    addFormat(p, S) {
      return typeof S == "string" && (S = new RegExp(S)), this.formats[p] = S, this;
    }
    errorsText(p = this.errors, { separator: S = ", ", dataVar: g = "data" } = {}) {
      return !p || p.length === 0 ? "No errors" : p.map((u) => `${g}${u.instancePath} ${u.message}`).reduce((u, h) => u + S + h);
    }
    $dataMetaSchema(p, S) {
      const g = this.RULES.all;
      p = JSON.parse(JSON.stringify(p));
      for (const u of S) {
        const h = u.split("/").slice(1);
        let b = p;
        for (const L of h)
          b = b[L];
        for (const L in g) {
          const M = g[L];
          if (typeof M != "object")
            continue;
          const { $data: J } = M.definition, B = b[L];
          J && B && (b[L] = k(B));
        }
      }
      return p;
    }
    _removeAllSchemas(p, S) {
      for (const g in p) {
        const u = p[g];
        (!S || S.test(g)) && (typeof u == "string" ? delete p[g] : u && !u.meta && (this._cache.delete(u.schema), delete p[g]));
      }
    }
    _addSchema(p, S, g, u = this.opts.validateSchema, h = this.opts.addUsedSchema) {
      let b;
      const { schemaId: L } = this.opts;
      if (typeof p == "object")
        b = p[L];
      else {
        if (this.opts.jtd)
          throw new Error("schema must be object");
        if (typeof p != "boolean")
          throw new Error("schema must be object or boolean");
      }
      let M = this._cache.get(p);
      if (M !== void 0)
        return M;
      g = (0, i.normalizeId)(b || g);
      const J = i.getSchemaRefs.call(this, p, g);
      return M = new o.SchemaEnv({ schema: p, schemaId: L, meta: S, baseId: g, localRefs: J }), this._cache.set(M.schema, M), h && !g.startsWith("#") && (g && this._checkUnique(g), this.refs[g] = M), u && this.validateSchema(p, !0), M;
    }
    _checkUnique(p) {
      if (this.schemas[p] || this.refs[p])
        throw new Error(`schema with key or id "${p}" already exists`);
    }
    _compileSchemaEnv(p) {
      if (p.meta ? this._compileMetaSchema(p) : o.compileSchema.call(this, p), !p.validate)
        throw new Error("ajv implementation error");
      return p.validate;
    }
    _compileMetaSchema(p) {
      const S = this.opts;
      this.opts = this._metaOpts;
      try {
        o.compileSchema.call(this, p);
      } finally {
        this.opts = S;
      }
    }
  }
  O.ValidationError = n.default, O.MissingRefError = s.default, e.default = O;
  function j(P, p, S, g = "error") {
    for (const u in P) {
      const h = u;
      h in p && this.logger[g](`${S}: option ${u}. ${P[h]}`);
    }
  }
  function x(P) {
    return P = (0, i.normalizeId)(P), this.schemas[P] || this.refs[P];
  }
  function te() {
    const P = this.opts.schemas;
    if (P)
      if (Array.isArray(P))
        this.addSchema(P);
      else
        for (const p in P)
          this.addSchema(P[p], p);
  }
  function $e() {
    for (const P in this.opts.formats) {
      const p = this.opts.formats[P];
      p && this.addFormat(P, p);
    }
  }
  function we(P) {
    if (Array.isArray(P)) {
      this.addVocabulary(P);
      return;
    }
    this.logger.warn("keywords option as map is deprecated, pass array");
    for (const p in P) {
      const S = P[p];
      S.keyword || (S.keyword = p), this.addKeyword(S);
    }
  }
  function Re() {
    const P = { ...this.opts };
    for (const p of E)
      delete P[p];
    return P;
  }
  const z = { log() {
  }, warn() {
  }, error() {
  } };
  function K(P) {
    if (P === !1)
      return z;
    if (P === void 0)
      return console;
    if (P.log && P.warn && P.error)
      return P;
    throw new Error("logger must implement log, warn and error methods");
  }
  const Z = /^[a-z_$][a-z0-9_$:-]*$/i;
  function I(P, p) {
    const { RULES: S } = this;
    if ((0, c.eachItem)(P, (g) => {
      if (S.keywords[g])
        throw new Error(`Keyword ${g} is already defined`);
      if (!Z.test(g))
        throw new Error(`Keyword ${g} has invalid name`);
    }), !!p && p.$data && !("code" in p || "validate" in p))
      throw new Error('$data keyword must have "code" or "validate" function');
  }
  function N(P, p, S) {
    var g;
    const u = p == null ? void 0 : p.post;
    if (S && u)
      throw new Error('keyword with "post" flag cannot have "type"');
    const { RULES: h } = this;
    let b = u ? h.post : h.rules.find(({ type: M }) => M === S);
    if (b || (b = { type: S, rules: [] }, h.rules.push(b)), h.keywords[P] = !0, !p)
      return;
    const L = {
      keyword: P,
      definition: {
        ...p,
        type: (0, d.getJSONTypes)(p.type),
        schemaType: (0, d.getJSONTypes)(p.schemaType)
      }
    };
    p.before ? C.call(this, b, L, p.before) : b.rules.push(L), h.all[P] = L, (g = p.implements) === null || g === void 0 || g.forEach((M) => this.addKeyword(M));
  }
  function C(P, p, S) {
    const g = P.rules.findIndex((u) => u.keyword === S);
    g >= 0 ? P.rules.splice(g, 0, p) : (P.rules.push(p), this.logger.warn(`rule ${S} is not defined`));
  }
  function A(P) {
    let { metaSchema: p } = P;
    p !== void 0 && (P.$data && this.opts.$data && (p = k(p)), P.validateSchema = this.compile(p, !0));
  }
  const V = {
    $ref: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#"
  };
  function k(P) {
    return { anyOf: [P, V] };
  }
})(Fn);
var es = {}, jr = {}, ts = {};
Object.defineProperty(ts, "__esModule", { value: !0 });
const ku = {
  keyword: "id",
  code() {
    throw new Error('NOT SUPPORTED: keyword "id", use "$id" for schema ID');
  }
};
ts.default = ku;
var Ke = {};
Object.defineProperty(Ke, "__esModule", { value: !0 });
Ke.callRef = Ke.getValidate = void 0;
const Cu = $t, da = W, ge = U, _t = Ee, fa = me, Zt = T, Du = {
  keyword: "$ref",
  schemaType: "string",
  code(e) {
    const { gen: t, schema: r, it: n } = e, { baseId: s, schemaEnv: a, validateName: o, opts: l, self: i } = n, { root: d } = a;
    if ((r === "#" || r === "#/") && s === d.baseId)
      return f();
    const c = fa.resolveRef.call(i, d, s, r);
    if (c === void 0)
      throw new Cu.default(n.opts.uriResolver, s, r);
    if (c instanceof fa.SchemaEnv)
      return _(c);
    return $(c);
    function f() {
      if (a === d)
        return mr(e, o, a, a.$async);
      const E = t.scopeValue("root", { ref: d });
      return mr(e, (0, ge._)`${E}.validate`, d, d.$async);
    }
    function _(E) {
      const y = Zo(e, E);
      mr(e, y, E, E.$async);
    }
    function $(E) {
      const y = t.scopeValue("schema", l.code.source === !0 ? { ref: E, code: (0, ge.stringify)(E) } : { ref: E }), v = t.name("valid"), m = e.subschema({
        schema: E,
        dataTypes: [],
        schemaPath: ge.nil,
        topSchemaRef: y,
        errSchemaPath: r
      }, v);
      e.mergeEvaluated(m), e.ok(v);
    }
  }
};
function Zo(e, t) {
  const { gen: r } = e;
  return t.validate ? r.scopeValue("validate", { ref: t.validate }) : (0, ge._)`${r.scopeValue("wrapper", { ref: t })}.validate`;
}
Ke.getValidate = Zo;
function mr(e, t, r, n) {
  const { gen: s, it: a } = e, { allErrors: o, schemaEnv: l, opts: i } = a, d = i.passContext ? _t.default.this : ge.nil;
  n ? c() : f();
  function c() {
    if (!l.$async)
      throw new Error("async schema referenced by sync schema");
    const E = s.let("valid");
    s.try(() => {
      s.code((0, ge._)`await ${(0, da.callValidateCode)(e, t, d)}`), $(t), o || s.assign(E, !0);
    }, (y) => {
      s.if((0, ge._)`!(${y} instanceof ${a.ValidationError})`, () => s.throw(y)), _(y), o || s.assign(E, !1);
    }), e.ok(E);
  }
  function f() {
    e.result((0, da.callValidateCode)(e, t, d), () => $(t), () => _(t));
  }
  function _(E) {
    const y = (0, ge._)`${E}.errors`;
    s.assign(_t.default.vErrors, (0, ge._)`${_t.default.vErrors} === null ? ${y} : ${_t.default.vErrors}.concat(${y})`), s.assign(_t.default.errors, (0, ge._)`${_t.default.vErrors}.length`);
  }
  function $(E) {
    var y;
    if (!a.opts.unevaluated)
      return;
    const v = (y = r == null ? void 0 : r.validate) === null || y === void 0 ? void 0 : y.evaluated;
    if (a.props !== !0)
      if (v && !v.dynamicProps)
        v.props !== void 0 && (a.props = Zt.mergeEvaluated.props(s, v.props, a.props));
      else {
        const m = s.var("props", (0, ge._)`${E}.evaluated.props`);
        a.props = Zt.mergeEvaluated.props(s, m, a.props, ge.Name);
      }
    if (a.items !== !0)
      if (v && !v.dynamicItems)
        v.items !== void 0 && (a.items = Zt.mergeEvaluated.items(s, v.items, a.items));
      else {
        const m = s.var("items", (0, ge._)`${E}.evaluated.items`);
        a.items = Zt.mergeEvaluated.items(s, m, a.items, ge.Name);
      }
  }
}
Ke.callRef = mr;
Ke.default = Du;
Object.defineProperty(jr, "__esModule", { value: !0 });
const Lu = ts, Mu = Ke, Vu = [
  "$schema",
  "$id",
  "$defs",
  "$vocabulary",
  { keyword: "$comment" },
  "definitions",
  Lu.default,
  Mu.default
];
jr.default = Vu;
var Ar = {}, rs = {};
Object.defineProperty(rs, "__esModule", { value: !0 });
const Er = U, xe = Er.operators, wr = {
  maximum: { okStr: "<=", ok: xe.LTE, fail: xe.GT },
  minimum: { okStr: ">=", ok: xe.GTE, fail: xe.LT },
  exclusiveMaximum: { okStr: "<", ok: xe.LT, fail: xe.GTE },
  exclusiveMinimum: { okStr: ">", ok: xe.GT, fail: xe.LTE }
}, zu = {
  message: ({ keyword: e, schemaCode: t }) => (0, Er.str)`must be ${wr[e].okStr} ${t}`,
  params: ({ keyword: e, schemaCode: t }) => (0, Er._)`{comparison: ${wr[e].okStr}, limit: ${t}}`
}, Fu = {
  keyword: Object.keys(wr),
  type: "number",
  schemaType: "number",
  $data: !0,
  error: zu,
  code(e) {
    const { keyword: t, data: r, schemaCode: n } = e;
    e.fail$data((0, Er._)`${r} ${wr[t].fail} ${n} || isNaN(${r})`);
  }
};
rs.default = Fu;
var ns = {};
Object.defineProperty(ns, "__esModule", { value: !0 });
const qt = U, Uu = {
  message: ({ schemaCode: e }) => (0, qt.str)`must be multiple of ${e}`,
  params: ({ schemaCode: e }) => (0, qt._)`{multipleOf: ${e}}`
}, qu = {
  keyword: "multipleOf",
  type: "number",
  schemaType: "number",
  $data: !0,
  error: Uu,
  code(e) {
    const { gen: t, data: r, schemaCode: n, it: s } = e, a = s.opts.multipleOfPrecision, o = t.let("res"), l = a ? (0, qt._)`Math.abs(Math.round(${o}) - ${o}) > 1e-${a}` : (0, qt._)`${o} !== parseInt(${o})`;
    e.fail$data((0, qt._)`(${n} === 0 || (${o} = ${r}/${n}, ${l}))`);
  }
};
ns.default = qu;
var ss = {}, as = {};
Object.defineProperty(as, "__esModule", { value: !0 });
function Qo(e) {
  const t = e.length;
  let r = 0, n = 0, s;
  for (; n < t; )
    r++, s = e.charCodeAt(n++), s >= 55296 && s <= 56319 && n < t && (s = e.charCodeAt(n), (s & 64512) === 56320 && n++);
  return r;
}
as.default = Qo;
Qo.code = 'require("ajv/dist/runtime/ucs2length").default';
Object.defineProperty(ss, "__esModule", { value: !0 });
const it = U, Gu = T, Ku = as, Hu = {
  message({ keyword: e, schemaCode: t }) {
    const r = e === "maxLength" ? "more" : "fewer";
    return (0, it.str)`must NOT have ${r} than ${t} characters`;
  },
  params: ({ schemaCode: e }) => (0, it._)`{limit: ${e}}`
}, Xu = {
  keyword: ["maxLength", "minLength"],
  type: "string",
  schemaType: "number",
  $data: !0,
  error: Hu,
  code(e) {
    const { keyword: t, data: r, schemaCode: n, it: s } = e, a = t === "maxLength" ? it.operators.GT : it.operators.LT, o = s.opts.unicode === !1 ? (0, it._)`${r}.length` : (0, it._)`${(0, Gu.useFunc)(e.gen, Ku.default)}(${r})`;
    e.fail$data((0, it._)`${o} ${a} ${n}`);
  }
};
ss.default = Xu;
var os = {};
Object.defineProperty(os, "__esModule", { value: !0 });
const Wu = W, Sr = U, Bu = {
  message: ({ schemaCode: e }) => (0, Sr.str)`must match pattern "${e}"`,
  params: ({ schemaCode: e }) => (0, Sr._)`{pattern: ${e}}`
}, xu = {
  keyword: "pattern",
  type: "string",
  schemaType: "string",
  $data: !0,
  error: Bu,
  code(e) {
    const { data: t, $data: r, schema: n, schemaCode: s, it: a } = e, o = a.opts.unicodeRegExp ? "u" : "", l = r ? (0, Sr._)`(new RegExp(${s}, ${o}))` : (0, Wu.usePattern)(e, n);
    e.fail$data((0, Sr._)`!${l}.test(${t})`);
  }
};
os.default = xu;
var is = {};
Object.defineProperty(is, "__esModule", { value: !0 });
const Gt = U, Ju = {
  message({ keyword: e, schemaCode: t }) {
    const r = e === "maxProperties" ? "more" : "fewer";
    return (0, Gt.str)`must NOT have ${r} than ${t} properties`;
  },
  params: ({ schemaCode: e }) => (0, Gt._)`{limit: ${e}}`
}, Yu = {
  keyword: ["maxProperties", "minProperties"],
  type: "object",
  schemaType: "number",
  $data: !0,
  error: Ju,
  code(e) {
    const { keyword: t, data: r, schemaCode: n } = e, s = t === "maxProperties" ? Gt.operators.GT : Gt.operators.LT;
    e.fail$data((0, Gt._)`Object.keys(${r}).length ${s} ${n}`);
  }
};
is.default = Yu;
var cs = {};
Object.defineProperty(cs, "__esModule", { value: !0 });
const Mt = W, Kt = U, Zu = T, Qu = {
  message: ({ params: { missingProperty: e } }) => (0, Kt.str)`must have required property '${e}'`,
  params: ({ params: { missingProperty: e } }) => (0, Kt._)`{missingProperty: ${e}}`
}, ed = {
  keyword: "required",
  type: "object",
  schemaType: "array",
  $data: !0,
  error: Qu,
  code(e) {
    const { gen: t, schema: r, schemaCode: n, data: s, $data: a, it: o } = e, { opts: l } = o;
    if (!a && r.length === 0)
      return;
    const i = r.length >= l.loopRequired;
    if (o.allErrors ? d() : c(), l.strictRequired) {
      const $ = e.parentSchema.properties, { definedProperties: E } = e.it;
      for (const y of r)
        if (($ == null ? void 0 : $[y]) === void 0 && !E.has(y)) {
          const v = o.schemaEnv.baseId + o.errSchemaPath, m = `required property "${y}" is not defined at "${v}" (strictRequired)`;
          (0, Zu.checkStrictMode)(o, m, o.opts.strictRequired);
        }
    }
    function d() {
      if (i || a)
        e.block$data(Kt.nil, f);
      else
        for (const $ of r)
          (0, Mt.checkReportMissingProp)(e, $);
    }
    function c() {
      const $ = t.let("missing");
      if (i || a) {
        const E = t.let("valid", !0);
        e.block$data(E, () => _($, E)), e.ok(E);
      } else
        t.if((0, Mt.checkMissingProp)(e, r, $)), (0, Mt.reportMissingProp)(e, $), t.else();
    }
    function f() {
      t.forOf("prop", n, ($) => {
        e.setParams({ missingProperty: $ }), t.if((0, Mt.noPropertyInData)(t, s, $, l.ownProperties), () => e.error());
      });
    }
    function _($, E) {
      e.setParams({ missingProperty: $ }), t.forOf($, n, () => {
        t.assign(E, (0, Mt.propertyInData)(t, s, $, l.ownProperties)), t.if((0, Kt.not)(E), () => {
          e.error(), t.break();
        });
      }, Kt.nil);
    }
  }
};
cs.default = ed;
var ls = {};
Object.defineProperty(ls, "__esModule", { value: !0 });
const Ht = U, td = {
  message({ keyword: e, schemaCode: t }) {
    const r = e === "maxItems" ? "more" : "fewer";
    return (0, Ht.str)`must NOT have ${r} than ${t} items`;
  },
  params: ({ schemaCode: e }) => (0, Ht._)`{limit: ${e}}`
}, rd = {
  keyword: ["maxItems", "minItems"],
  type: "array",
  schemaType: "number",
  $data: !0,
  error: td,
  code(e) {
    const { keyword: t, data: r, schemaCode: n } = e, s = t === "maxItems" ? Ht.operators.GT : Ht.operators.LT;
    e.fail$data((0, Ht._)`${r}.length ${s} ${n}`);
  }
};
ls.default = rd;
var us = {}, Bt = {};
Object.defineProperty(Bt, "__esModule", { value: !0 });
const ei = bo;
ei.code = 'require("ajv/dist/runtime/equal").default';
Bt.default = ei;
Object.defineProperty(us, "__esModule", { value: !0 });
const fn = se, ie = U, nd = T, sd = Bt, ad = {
  message: ({ params: { i: e, j: t } }) => (0, ie.str)`must NOT have duplicate items (items ## ${t} and ${e} are identical)`,
  params: ({ params: { i: e, j: t } }) => (0, ie._)`{i: ${e}, j: ${t}}`
}, od = {
  keyword: "uniqueItems",
  type: "array",
  schemaType: "boolean",
  $data: !0,
  error: ad,
  code(e) {
    const { gen: t, data: r, $data: n, schema: s, parentSchema: a, schemaCode: o, it: l } = e;
    if (!n && !s)
      return;
    const i = t.let("valid"), d = a.items ? (0, fn.getSchemaTypes)(a.items) : [];
    e.block$data(i, c, (0, ie._)`${o} === false`), e.ok(i);
    function c() {
      const E = t.let("i", (0, ie._)`${r}.length`), y = t.let("j");
      e.setParams({ i: E, j: y }), t.assign(i, !0), t.if((0, ie._)`${E} > 1`, () => (f() ? _ : $)(E, y));
    }
    function f() {
      return d.length > 0 && !d.some((E) => E === "object" || E === "array");
    }
    function _(E, y) {
      const v = t.name("item"), m = (0, fn.checkDataTypes)(d, v, l.opts.strictNumbers, fn.DataType.Wrong), w = t.const("indices", (0, ie._)`{}`);
      t.for((0, ie._)`;${E}--;`, () => {
        t.let(v, (0, ie._)`${r}[${E}]`), t.if(m, (0, ie._)`continue`), d.length > 1 && t.if((0, ie._)`typeof ${v} == "string"`, (0, ie._)`${v} += "_"`), t.if((0, ie._)`typeof ${w}[${v}] == "number"`, () => {
          t.assign(y, (0, ie._)`${w}[${v}]`), e.error(), t.assign(i, !1).break();
        }).code((0, ie._)`${w}[${v}] = ${E}`);
      });
    }
    function $(E, y) {
      const v = (0, nd.useFunc)(t, sd.default), m = t.name("outer");
      t.label(m).for((0, ie._)`;${E}--;`, () => t.for((0, ie._)`${y} = ${E}; ${y}--;`, () => t.if((0, ie._)`${v}(${r}[${E}], ${r}[${y}])`, () => {
        e.error(), t.assign(i, !1).break(m);
      })));
    }
  }
};
us.default = od;
var ds = {};
Object.defineProperty(ds, "__esModule", { value: !0 });
const Tn = U, id = T, cd = Bt, ld = {
  message: "must be equal to constant",
  params: ({ schemaCode: e }) => (0, Tn._)`{allowedValue: ${e}}`
}, ud = {
  keyword: "const",
  $data: !0,
  error: ld,
  code(e) {
    const { gen: t, data: r, $data: n, schemaCode: s, schema: a } = e;
    n || a && typeof a == "object" ? e.fail$data((0, Tn._)`!${(0, id.useFunc)(t, cd.default)}(${r}, ${s})`) : e.fail((0, Tn._)`${a} !== ${r}`);
  }
};
ds.default = ud;
var fs = {};
Object.defineProperty(fs, "__esModule", { value: !0 });
const Ft = U, dd = T, fd = Bt, hd = {
  message: "must be equal to one of the allowed values",
  params: ({ schemaCode: e }) => (0, Ft._)`{allowedValues: ${e}}`
}, md = {
  keyword: "enum",
  schemaType: "array",
  $data: !0,
  error: hd,
  code(e) {
    const { gen: t, data: r, $data: n, schema: s, schemaCode: a, it: o } = e;
    if (!n && s.length === 0)
      throw new Error("enum must have non-empty array");
    const l = s.length >= o.opts.loopEnum;
    let i;
    const d = () => i ?? (i = (0, dd.useFunc)(t, fd.default));
    let c;
    if (l || n)
      c = t.let("valid"), e.block$data(c, f);
    else {
      if (!Array.isArray(s))
        throw new Error("ajv implementation error");
      const $ = t.const("vSchema", a);
      c = (0, Ft.or)(...s.map((E, y) => _($, y)));
    }
    e.pass(c);
    function f() {
      t.assign(c, !1), t.forOf("v", a, ($) => t.if((0, Ft._)`${d()}(${r}, ${$})`, () => t.assign(c, !0).break()));
    }
    function _($, E) {
      const y = s[E];
      return typeof y == "object" && y !== null ? (0, Ft._)`${d()}(${r}, ${$}[${E}])` : (0, Ft._)`${r} === ${y}`;
    }
  }
};
fs.default = md;
Object.defineProperty(Ar, "__esModule", { value: !0 });
const pd = rs, $d = ns, yd = ss, gd = os, vd = is, _d = cs, Ed = ls, wd = us, Sd = ds, bd = fs, Pd = [
  // number
  pd.default,
  $d.default,
  // string
  yd.default,
  gd.default,
  // object
  vd.default,
  _d.default,
  // array
  Ed.default,
  wd.default,
  // any
  { keyword: "type", schemaType: ["string", "array"] },
  { keyword: "nullable", schemaType: "boolean" },
  Sd.default,
  bd.default
];
Ar.default = Pd;
var kr = {}, Ot = {};
Object.defineProperty(Ot, "__esModule", { value: !0 });
Ot.validateAdditionalItems = void 0;
const ct = U, jn = T, Rd = {
  message: ({ params: { len: e } }) => (0, ct.str)`must NOT have more than ${e} items`,
  params: ({ params: { len: e } }) => (0, ct._)`{limit: ${e}}`
}, Id = {
  keyword: "additionalItems",
  type: "array",
  schemaType: ["boolean", "object"],
  before: "uniqueItems",
  error: Rd,
  code(e) {
    const { parentSchema: t, it: r } = e, { items: n } = t;
    if (!Array.isArray(n)) {
      (0, jn.checkStrictMode)(r, '"additionalItems" is ignored when "items" is not an array of schemas');
      return;
    }
    ti(e, n);
  }
};
function ti(e, t) {
  const { gen: r, schema: n, data: s, keyword: a, it: o } = e;
  o.items = !0;
  const l = r.const("len", (0, ct._)`${s}.length`);
  if (n === !1)
    e.setParams({ len: t.length }), e.pass((0, ct._)`${l} <= ${t.length}`);
  else if (typeof n == "object" && !(0, jn.alwaysValidSchema)(o, n)) {
    const d = r.var("valid", (0, ct._)`${l} <= ${t.length}`);
    r.if((0, ct.not)(d), () => i(d)), e.ok(d);
  }
  function i(d) {
    r.forRange("i", t.length, l, (c) => {
      e.subschema({ keyword: a, dataProp: c, dataPropType: jn.Type.Num }, d), o.allErrors || r.if((0, ct.not)(d), () => r.break());
    });
  }
}
Ot.validateAdditionalItems = ti;
Ot.default = Id;
var hs = {}, Tt = {};
Object.defineProperty(Tt, "__esModule", { value: !0 });
Tt.validateTuple = void 0;
const ha = U, pr = T, Nd = W, Od = {
  keyword: "items",
  type: "array",
  schemaType: ["object", "array", "boolean"],
  before: "uniqueItems",
  code(e) {
    const { schema: t, it: r } = e;
    if (Array.isArray(t))
      return ri(e, "additionalItems", t);
    r.items = !0, !(0, pr.alwaysValidSchema)(r, t) && e.ok((0, Nd.validateArray)(e));
  }
};
function ri(e, t, r = e.schema) {
  const { gen: n, parentSchema: s, data: a, keyword: o, it: l } = e;
  c(s), l.opts.unevaluated && r.length && l.items !== !0 && (l.items = pr.mergeEvaluated.items(n, r.length, l.items));
  const i = n.name("valid"), d = n.const("len", (0, ha._)`${a}.length`);
  r.forEach((f, _) => {
    (0, pr.alwaysValidSchema)(l, f) || (n.if((0, ha._)`${d} > ${_}`, () => e.subschema({
      keyword: o,
      schemaProp: _,
      dataProp: _
    }, i)), e.ok(i));
  });
  function c(f) {
    const { opts: _, errSchemaPath: $ } = l, E = r.length, y = E === f.minItems && (E === f.maxItems || f[t] === !1);
    if (_.strictTuples && !y) {
      const v = `"${o}" is ${E}-tuple, but minItems or maxItems/${t} are not specified or different at path "${$}"`;
      (0, pr.checkStrictMode)(l, v, _.strictTuples);
    }
  }
}
Tt.validateTuple = ri;
Tt.default = Od;
Object.defineProperty(hs, "__esModule", { value: !0 });
const Td = Tt, jd = {
  keyword: "prefixItems",
  type: "array",
  schemaType: ["array"],
  before: "uniqueItems",
  code: (e) => (0, Td.validateTuple)(e, "items")
};
hs.default = jd;
var ms = {};
Object.defineProperty(ms, "__esModule", { value: !0 });
const ma = U, Ad = T, kd = W, Cd = Ot, Dd = {
  message: ({ params: { len: e } }) => (0, ma.str)`must NOT have more than ${e} items`,
  params: ({ params: { len: e } }) => (0, ma._)`{limit: ${e}}`
}, Ld = {
  keyword: "items",
  type: "array",
  schemaType: ["object", "boolean"],
  before: "uniqueItems",
  error: Dd,
  code(e) {
    const { schema: t, parentSchema: r, it: n } = e, { prefixItems: s } = r;
    n.items = !0, !(0, Ad.alwaysValidSchema)(n, t) && (s ? (0, Cd.validateAdditionalItems)(e, s) : e.ok((0, kd.validateArray)(e)));
  }
};
ms.default = Ld;
var ps = {};
Object.defineProperty(ps, "__esModule", { value: !0 });
const be = U, Qt = T, Md = {
  message: ({ params: { min: e, max: t } }) => t === void 0 ? (0, be.str)`must contain at least ${e} valid item(s)` : (0, be.str)`must contain at least ${e} and no more than ${t} valid item(s)`,
  params: ({ params: { min: e, max: t } }) => t === void 0 ? (0, be._)`{minContains: ${e}}` : (0, be._)`{minContains: ${e}, maxContains: ${t}}`
}, Vd = {
  keyword: "contains",
  type: "array",
  schemaType: ["object", "boolean"],
  before: "uniqueItems",
  trackErrors: !0,
  error: Md,
  code(e) {
    const { gen: t, schema: r, parentSchema: n, data: s, it: a } = e;
    let o, l;
    const { minContains: i, maxContains: d } = n;
    a.opts.next ? (o = i === void 0 ? 1 : i, l = d) : o = 1;
    const c = t.const("len", (0, be._)`${s}.length`);
    if (e.setParams({ min: o, max: l }), l === void 0 && o === 0) {
      (0, Qt.checkStrictMode)(a, '"minContains" == 0 without "maxContains": "contains" keyword ignored');
      return;
    }
    if (l !== void 0 && o > l) {
      (0, Qt.checkStrictMode)(a, '"minContains" > "maxContains" is always invalid'), e.fail();
      return;
    }
    if ((0, Qt.alwaysValidSchema)(a, r)) {
      let y = (0, be._)`${c} >= ${o}`;
      l !== void 0 && (y = (0, be._)`${y} && ${c} <= ${l}`), e.pass(y);
      return;
    }
    a.items = !0;
    const f = t.name("valid");
    l === void 0 && o === 1 ? $(f, () => t.if(f, () => t.break())) : o === 0 ? (t.let(f, !0), l !== void 0 && t.if((0, be._)`${s}.length > 0`, _)) : (t.let(f, !1), _()), e.result(f, () => e.reset());
    function _() {
      const y = t.name("_valid"), v = t.let("count", 0);
      $(y, () => t.if(y, () => E(v)));
    }
    function $(y, v) {
      t.forRange("i", 0, c, (m) => {
        e.subschema({
          keyword: "contains",
          dataProp: m,
          dataPropType: Qt.Type.Num,
          compositeRule: !0
        }, y), v();
      });
    }
    function E(y) {
      t.code((0, be._)`${y}++`), l === void 0 ? t.if((0, be._)`${y} >= ${o}`, () => t.assign(f, !0).break()) : (t.if((0, be._)`${y} > ${l}`, () => t.assign(f, !1).break()), o === 1 ? t.assign(f, !0) : t.if((0, be._)`${y} >= ${o}`, () => t.assign(f, !0)));
    }
  }
};
ps.default = Vd;
var Cr = {};
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.validateSchemaDeps = e.validatePropertyDeps = e.error = void 0;
  const t = U, r = T, n = W;
  e.error = {
    message: ({ params: { property: i, depsCount: d, deps: c } }) => {
      const f = d === 1 ? "property" : "properties";
      return (0, t.str)`must have ${f} ${c} when property ${i} is present`;
    },
    params: ({ params: { property: i, depsCount: d, deps: c, missingProperty: f } }) => (0, t._)`{property: ${i},
    missingProperty: ${f},
    depsCount: ${d},
    deps: ${c}}`
    // TODO change to reference
  };
  const s = {
    keyword: "dependencies",
    type: "object",
    schemaType: "object",
    error: e.error,
    code(i) {
      const [d, c] = a(i);
      o(i, d), l(i, c);
    }
  };
  function a({ schema: i }) {
    const d = {}, c = {};
    for (const f in i) {
      if (f === "__proto__")
        continue;
      const _ = Array.isArray(i[f]) ? d : c;
      _[f] = i[f];
    }
    return [d, c];
  }
  function o(i, d = i.schema) {
    const { gen: c, data: f, it: _ } = i;
    if (Object.keys(d).length === 0)
      return;
    const $ = c.let("missing");
    for (const E in d) {
      const y = d[E];
      if (y.length === 0)
        continue;
      const v = (0, n.propertyInData)(c, f, E, _.opts.ownProperties);
      i.setParams({
        property: E,
        depsCount: y.length,
        deps: y.join(", ")
      }), _.allErrors ? c.if(v, () => {
        for (const m of y)
          (0, n.checkReportMissingProp)(i, m);
      }) : (c.if((0, t._)`${v} && (${(0, n.checkMissingProp)(i, y, $)})`), (0, n.reportMissingProp)(i, $), c.else());
    }
  }
  e.validatePropertyDeps = o;
  function l(i, d = i.schema) {
    const { gen: c, data: f, keyword: _, it: $ } = i, E = c.name("valid");
    for (const y in d)
      (0, r.alwaysValidSchema)($, d[y]) || (c.if(
        (0, n.propertyInData)(c, f, y, $.opts.ownProperties),
        () => {
          const v = i.subschema({ keyword: _, schemaProp: y }, E);
          i.mergeValidEvaluated(v, E);
        },
        () => c.var(E, !0)
        // TODO var
      ), i.ok(E));
  }
  e.validateSchemaDeps = l, e.default = s;
})(Cr);
var $s = {};
Object.defineProperty($s, "__esModule", { value: !0 });
const ni = U, zd = T, Fd = {
  message: "property name must be valid",
  params: ({ params: e }) => (0, ni._)`{propertyName: ${e.propertyName}}`
}, Ud = {
  keyword: "propertyNames",
  type: "object",
  schemaType: ["object", "boolean"],
  error: Fd,
  code(e) {
    const { gen: t, schema: r, data: n, it: s } = e;
    if ((0, zd.alwaysValidSchema)(s, r))
      return;
    const a = t.name("valid");
    t.forIn("key", n, (o) => {
      e.setParams({ propertyName: o }), e.subschema({
        keyword: "propertyNames",
        data: o,
        dataTypes: ["string"],
        propertyName: o,
        compositeRule: !0
      }, a), t.if((0, ni.not)(a), () => {
        e.error(!0), s.allErrors || t.break();
      });
    }), e.ok(a);
  }
};
$s.default = Ud;
var Dr = {};
Object.defineProperty(Dr, "__esModule", { value: !0 });
const er = W, Ne = U, qd = Ee, tr = T, Gd = {
  message: "must NOT have additional properties",
  params: ({ params: e }) => (0, Ne._)`{additionalProperty: ${e.additionalProperty}}`
}, Kd = {
  keyword: "additionalProperties",
  type: ["object"],
  schemaType: ["boolean", "object"],
  allowUndefined: !0,
  trackErrors: !0,
  error: Gd,
  code(e) {
    const { gen: t, schema: r, parentSchema: n, data: s, errsCount: a, it: o } = e;
    if (!a)
      throw new Error("ajv implementation error");
    const { allErrors: l, opts: i } = o;
    if (o.props = !0, i.removeAdditional !== "all" && (0, tr.alwaysValidSchema)(o, r))
      return;
    const d = (0, er.allSchemaProperties)(n.properties), c = (0, er.allSchemaProperties)(n.patternProperties);
    f(), e.ok((0, Ne._)`${a} === ${qd.default.errors}`);
    function f() {
      t.forIn("key", s, (v) => {
        !d.length && !c.length ? E(v) : t.if(_(v), () => E(v));
      });
    }
    function _(v) {
      let m;
      if (d.length > 8) {
        const w = (0, tr.schemaRefOrVal)(o, n.properties, "properties");
        m = (0, er.isOwnProperty)(t, w, v);
      } else d.length ? m = (0, Ne.or)(...d.map((w) => (0, Ne._)`${v} === ${w}`)) : m = Ne.nil;
      return c.length && (m = (0, Ne.or)(m, ...c.map((w) => (0, Ne._)`${(0, er.usePattern)(e, w)}.test(${v})`))), (0, Ne.not)(m);
    }
    function $(v) {
      t.code((0, Ne._)`delete ${s}[${v}]`);
    }
    function E(v) {
      if (i.removeAdditional === "all" || i.removeAdditional && r === !1) {
        $(v);
        return;
      }
      if (r === !1) {
        e.setParams({ additionalProperty: v }), e.error(), l || t.break();
        return;
      }
      if (typeof r == "object" && !(0, tr.alwaysValidSchema)(o, r)) {
        const m = t.name("valid");
        i.removeAdditional === "failing" ? (y(v, m, !1), t.if((0, Ne.not)(m), () => {
          e.reset(), $(v);
        })) : (y(v, m), l || t.if((0, Ne.not)(m), () => t.break()));
      }
    }
    function y(v, m, w) {
      const R = {
        keyword: "additionalProperties",
        dataProp: v,
        dataPropType: tr.Type.Str
      };
      w === !1 && Object.assign(R, {
        compositeRule: !0,
        createErrors: !1,
        allErrors: !1
      }), e.subschema(R, m);
    }
  }
};
Dr.default = Kd;
var ys = {};
Object.defineProperty(ys, "__esModule", { value: !0 });
const Hd = Pe, pa = W, hn = T, $a = Dr, Xd = {
  keyword: "properties",
  type: "object",
  schemaType: "object",
  code(e) {
    const { gen: t, schema: r, parentSchema: n, data: s, it: a } = e;
    a.opts.removeAdditional === "all" && n.additionalProperties === void 0 && $a.default.code(new Hd.KeywordCxt(a, $a.default, "additionalProperties"));
    const o = (0, pa.allSchemaProperties)(r);
    for (const f of o)
      a.definedProperties.add(f);
    a.opts.unevaluated && o.length && a.props !== !0 && (a.props = hn.mergeEvaluated.props(t, (0, hn.toHash)(o), a.props));
    const l = o.filter((f) => !(0, hn.alwaysValidSchema)(a, r[f]));
    if (l.length === 0)
      return;
    const i = t.name("valid");
    for (const f of l)
      d(f) ? c(f) : (t.if((0, pa.propertyInData)(t, s, f, a.opts.ownProperties)), c(f), a.allErrors || t.else().var(i, !0), t.endIf()), e.it.definedProperties.add(f), e.ok(i);
    function d(f) {
      return a.opts.useDefaults && !a.compositeRule && r[f].default !== void 0;
    }
    function c(f) {
      e.subschema({
        keyword: "properties",
        schemaProp: f,
        dataProp: f
      }, i);
    }
  }
};
ys.default = Xd;
var gs = {};
Object.defineProperty(gs, "__esModule", { value: !0 });
const ya = W, rr = U, ga = T, va = T, Wd = {
  keyword: "patternProperties",
  type: "object",
  schemaType: "object",
  code(e) {
    const { gen: t, schema: r, data: n, parentSchema: s, it: a } = e, { opts: o } = a, l = (0, ya.allSchemaProperties)(r), i = l.filter((y) => (0, ga.alwaysValidSchema)(a, r[y]));
    if (l.length === 0 || i.length === l.length && (!a.opts.unevaluated || a.props === !0))
      return;
    const d = o.strictSchema && !o.allowMatchingProperties && s.properties, c = t.name("valid");
    a.props !== !0 && !(a.props instanceof rr.Name) && (a.props = (0, va.evaluatedPropsToName)(t, a.props));
    const { props: f } = a;
    _();
    function _() {
      for (const y of l)
        d && $(y), a.allErrors ? E(y) : (t.var(c, !0), E(y), t.if(c));
    }
    function $(y) {
      for (const v in d)
        new RegExp(y).test(v) && (0, ga.checkStrictMode)(a, `property ${v} matches pattern ${y} (use allowMatchingProperties)`);
    }
    function E(y) {
      t.forIn("key", n, (v) => {
        t.if((0, rr._)`${(0, ya.usePattern)(e, y)}.test(${v})`, () => {
          const m = i.includes(y);
          m || e.subschema({
            keyword: "patternProperties",
            schemaProp: y,
            dataProp: v,
            dataPropType: va.Type.Str
          }, c), a.opts.unevaluated && f !== !0 ? t.assign((0, rr._)`${f}[${v}]`, !0) : !m && !a.allErrors && t.if((0, rr.not)(c), () => t.break());
        });
      });
    }
  }
};
gs.default = Wd;
var vs = {};
Object.defineProperty(vs, "__esModule", { value: !0 });
const Bd = T, xd = {
  keyword: "not",
  schemaType: ["object", "boolean"],
  trackErrors: !0,
  code(e) {
    const { gen: t, schema: r, it: n } = e;
    if ((0, Bd.alwaysValidSchema)(n, r)) {
      e.fail();
      return;
    }
    const s = t.name("valid");
    e.subschema({
      keyword: "not",
      compositeRule: !0,
      createErrors: !1,
      allErrors: !1
    }, s), e.failResult(s, () => e.reset(), () => e.error());
  },
  error: { message: "must NOT be valid" }
};
vs.default = xd;
var _s = {};
Object.defineProperty(_s, "__esModule", { value: !0 });
const Jd = W, Yd = {
  keyword: "anyOf",
  schemaType: "array",
  trackErrors: !0,
  code: Jd.validateUnion,
  error: { message: "must match a schema in anyOf" }
};
_s.default = Yd;
var Es = {};
Object.defineProperty(Es, "__esModule", { value: !0 });
const $r = U, Zd = T, Qd = {
  message: "must match exactly one schema in oneOf",
  params: ({ params: e }) => (0, $r._)`{passingSchemas: ${e.passing}}`
}, ef = {
  keyword: "oneOf",
  schemaType: "array",
  trackErrors: !0,
  error: Qd,
  code(e) {
    const { gen: t, schema: r, parentSchema: n, it: s } = e;
    if (!Array.isArray(r))
      throw new Error("ajv implementation error");
    if (s.opts.discriminator && n.discriminator)
      return;
    const a = r, o = t.let("valid", !1), l = t.let("passing", null), i = t.name("_valid");
    e.setParams({ passing: l }), t.block(d), e.result(o, () => e.reset(), () => e.error(!0));
    function d() {
      a.forEach((c, f) => {
        let _;
        (0, Zd.alwaysValidSchema)(s, c) ? t.var(i, !0) : _ = e.subschema({
          keyword: "oneOf",
          schemaProp: f,
          compositeRule: !0
        }, i), f > 0 && t.if((0, $r._)`${i} && ${o}`).assign(o, !1).assign(l, (0, $r._)`[${l}, ${f}]`).else(), t.if(i, () => {
          t.assign(o, !0), t.assign(l, f), _ && e.mergeEvaluated(_, $r.Name);
        });
      });
    }
  }
};
Es.default = ef;
var ws = {};
Object.defineProperty(ws, "__esModule", { value: !0 });
const tf = T, rf = {
  keyword: "allOf",
  schemaType: "array",
  code(e) {
    const { gen: t, schema: r, it: n } = e;
    if (!Array.isArray(r))
      throw new Error("ajv implementation error");
    const s = t.name("valid");
    r.forEach((a, o) => {
      if ((0, tf.alwaysValidSchema)(n, a))
        return;
      const l = e.subschema({ keyword: "allOf", schemaProp: o }, s);
      e.ok(s), e.mergeEvaluated(l);
    });
  }
};
ws.default = rf;
var Ss = {};
Object.defineProperty(Ss, "__esModule", { value: !0 });
const br = U, si = T, nf = {
  message: ({ params: e }) => (0, br.str)`must match "${e.ifClause}" schema`,
  params: ({ params: e }) => (0, br._)`{failingKeyword: ${e.ifClause}}`
}, sf = {
  keyword: "if",
  schemaType: ["object", "boolean"],
  trackErrors: !0,
  error: nf,
  code(e) {
    const { gen: t, parentSchema: r, it: n } = e;
    r.then === void 0 && r.else === void 0 && (0, si.checkStrictMode)(n, '"if" without "then" and "else" is ignored');
    const s = _a(n, "then"), a = _a(n, "else");
    if (!s && !a)
      return;
    const o = t.let("valid", !0), l = t.name("_valid");
    if (i(), e.reset(), s && a) {
      const c = t.let("ifClause");
      e.setParams({ ifClause: c }), t.if(l, d("then", c), d("else", c));
    } else s ? t.if(l, d("then")) : t.if((0, br.not)(l), d("else"));
    e.pass(o, () => e.error(!0));
    function i() {
      const c = e.subschema({
        keyword: "if",
        compositeRule: !0,
        createErrors: !1,
        allErrors: !1
      }, l);
      e.mergeEvaluated(c);
    }
    function d(c, f) {
      return () => {
        const _ = e.subschema({ keyword: c }, l);
        t.assign(o, l), e.mergeValidEvaluated(_, o), f ? t.assign(f, (0, br._)`${c}`) : e.setParams({ ifClause: c });
      };
    }
  }
};
function _a(e, t) {
  const r = e.schema[t];
  return r !== void 0 && !(0, si.alwaysValidSchema)(e, r);
}
Ss.default = sf;
var bs = {};
Object.defineProperty(bs, "__esModule", { value: !0 });
const af = T, of = {
  keyword: ["then", "else"],
  schemaType: ["object", "boolean"],
  code({ keyword: e, parentSchema: t, it: r }) {
    t.if === void 0 && (0, af.checkStrictMode)(r, `"${e}" without "if" is ignored`);
  }
};
bs.default = of;
Object.defineProperty(kr, "__esModule", { value: !0 });
const cf = Ot, lf = hs, uf = Tt, df = ms, ff = ps, hf = Cr, mf = $s, pf = Dr, $f = ys, yf = gs, gf = vs, vf = _s, _f = Es, Ef = ws, wf = Ss, Sf = bs;
function bf(e = !1) {
  const t = [
    // any
    gf.default,
    vf.default,
    _f.default,
    Ef.default,
    wf.default,
    Sf.default,
    // object
    mf.default,
    pf.default,
    hf.default,
    $f.default,
    yf.default
  ];
  return e ? t.push(lf.default, df.default) : t.push(cf.default, uf.default), t.push(ff.default), t;
}
kr.default = bf;
var Ps = {}, jt = {};
Object.defineProperty(jt, "__esModule", { value: !0 });
jt.dynamicAnchor = void 0;
const mn = U, Pf = Ee, Ea = me, Rf = Ke, If = {
  keyword: "$dynamicAnchor",
  schemaType: "string",
  code: (e) => ai(e, e.schema)
};
function ai(e, t) {
  const { gen: r, it: n } = e;
  n.schemaEnv.root.dynamicAnchors[t] = !0;
  const s = (0, mn._)`${Pf.default.dynamicAnchors}${(0, mn.getProperty)(t)}`, a = n.errSchemaPath === "#" ? n.validateName : Nf(e);
  r.if((0, mn._)`!${s}`, () => r.assign(s, a));
}
jt.dynamicAnchor = ai;
function Nf(e) {
  const { schemaEnv: t, schema: r, self: n } = e.it, { root: s, baseId: a, localRefs: o, meta: l } = t.root, { schemaId: i } = n.opts, d = new Ea.SchemaEnv({ schema: r, schemaId: i, root: s, baseId: a, localRefs: o, meta: l });
  return Ea.compileSchema.call(n, d), (0, Rf.getValidate)(e, d);
}
jt.default = If;
var At = {};
Object.defineProperty(At, "__esModule", { value: !0 });
At.dynamicRef = void 0;
const wa = U, Of = Ee, Sa = Ke, Tf = {
  keyword: "$dynamicRef",
  schemaType: "string",
  code: (e) => oi(e, e.schema)
};
function oi(e, t) {
  const { gen: r, keyword: n, it: s } = e;
  if (t[0] !== "#")
    throw new Error(`"${n}" only supports hash fragment reference`);
  const a = t.slice(1);
  if (s.allErrors)
    o();
  else {
    const i = r.let("valid", !1);
    o(i), e.ok(i);
  }
  function o(i) {
    if (s.schemaEnv.root.dynamicAnchors[a]) {
      const d = r.let("_v", (0, wa._)`${Of.default.dynamicAnchors}${(0, wa.getProperty)(a)}`);
      r.if(d, l(d, i), l(s.validateName, i));
    } else
      l(s.validateName, i)();
  }
  function l(i, d) {
    return d ? () => r.block(() => {
      (0, Sa.callRef)(e, i), r.let(d, !0);
    }) : () => (0, Sa.callRef)(e, i);
  }
}
At.dynamicRef = oi;
At.default = Tf;
var Rs = {};
Object.defineProperty(Rs, "__esModule", { value: !0 });
const jf = jt, Af = T, kf = {
  keyword: "$recursiveAnchor",
  schemaType: "boolean",
  code(e) {
    e.schema ? (0, jf.dynamicAnchor)(e, "") : (0, Af.checkStrictMode)(e.it, "$recursiveAnchor: false is ignored");
  }
};
Rs.default = kf;
var Is = {};
Object.defineProperty(Is, "__esModule", { value: !0 });
const Cf = At, Df = {
  keyword: "$recursiveRef",
  schemaType: "string",
  code: (e) => (0, Cf.dynamicRef)(e, e.schema)
};
Is.default = Df;
Object.defineProperty(Ps, "__esModule", { value: !0 });
const Lf = jt, Mf = At, Vf = Rs, zf = Is, Ff = [Lf.default, Mf.default, Vf.default, zf.default];
Ps.default = Ff;
var Ns = {}, Os = {};
Object.defineProperty(Os, "__esModule", { value: !0 });
const ba = Cr, Uf = {
  keyword: "dependentRequired",
  type: "object",
  schemaType: "object",
  error: ba.error,
  code: (e) => (0, ba.validatePropertyDeps)(e)
};
Os.default = Uf;
var Ts = {};
Object.defineProperty(Ts, "__esModule", { value: !0 });
const qf = Cr, Gf = {
  keyword: "dependentSchemas",
  type: "object",
  schemaType: "object",
  code: (e) => (0, qf.validateSchemaDeps)(e)
};
Ts.default = Gf;
var js = {};
Object.defineProperty(js, "__esModule", { value: !0 });
const Kf = T, Hf = {
  keyword: ["maxContains", "minContains"],
  type: "array",
  schemaType: "number",
  code({ keyword: e, parentSchema: t, it: r }) {
    t.contains === void 0 && (0, Kf.checkStrictMode)(r, `"${e}" without "contains" is ignored`);
  }
};
js.default = Hf;
Object.defineProperty(Ns, "__esModule", { value: !0 });
const Xf = Os, Wf = Ts, Bf = js, xf = [Xf.default, Wf.default, Bf.default];
Ns.default = xf;
var As = {}, ks = {};
Object.defineProperty(ks, "__esModule", { value: !0 });
const Ye = U, Pa = T, Jf = Ee, Yf = {
  message: "must NOT have unevaluated properties",
  params: ({ params: e }) => (0, Ye._)`{unevaluatedProperty: ${e.unevaluatedProperty}}`
}, Zf = {
  keyword: "unevaluatedProperties",
  type: "object",
  schemaType: ["boolean", "object"],
  trackErrors: !0,
  error: Yf,
  code(e) {
    const { gen: t, schema: r, data: n, errsCount: s, it: a } = e;
    if (!s)
      throw new Error("ajv implementation error");
    const { allErrors: o, props: l } = a;
    l instanceof Ye.Name ? t.if((0, Ye._)`${l} !== true`, () => t.forIn("key", n, (f) => t.if(d(l, f), () => i(f)))) : l !== !0 && t.forIn("key", n, (f) => l === void 0 ? i(f) : t.if(c(l, f), () => i(f))), a.props = !0, e.ok((0, Ye._)`${s} === ${Jf.default.errors}`);
    function i(f) {
      if (r === !1) {
        e.setParams({ unevaluatedProperty: f }), e.error(), o || t.break();
        return;
      }
      if (!(0, Pa.alwaysValidSchema)(a, r)) {
        const _ = t.name("valid");
        e.subschema({
          keyword: "unevaluatedProperties",
          dataProp: f,
          dataPropType: Pa.Type.Str
        }, _), o || t.if((0, Ye.not)(_), () => t.break());
      }
    }
    function d(f, _) {
      return (0, Ye._)`!${f} || !${f}[${_}]`;
    }
    function c(f, _) {
      const $ = [];
      for (const E in f)
        f[E] === !0 && $.push((0, Ye._)`${_} !== ${E}`);
      return (0, Ye.and)(...$);
    }
  }
};
ks.default = Zf;
var Cs = {};
Object.defineProperty(Cs, "__esModule", { value: !0 });
const lt = U, Ra = T, Qf = {
  message: ({ params: { len: e } }) => (0, lt.str)`must NOT have more than ${e} items`,
  params: ({ params: { len: e } }) => (0, lt._)`{limit: ${e}}`
}, eh = {
  keyword: "unevaluatedItems",
  type: "array",
  schemaType: ["boolean", "object"],
  error: Qf,
  code(e) {
    const { gen: t, schema: r, data: n, it: s } = e, a = s.items || 0;
    if (a === !0)
      return;
    const o = t.const("len", (0, lt._)`${n}.length`);
    if (r === !1)
      e.setParams({ len: a }), e.fail((0, lt._)`${o} > ${a}`);
    else if (typeof r == "object" && !(0, Ra.alwaysValidSchema)(s, r)) {
      const i = t.var("valid", (0, lt._)`${o} <= ${a}`);
      t.if((0, lt.not)(i), () => l(i, a)), e.ok(i);
    }
    s.items = !0;
    function l(i, d) {
      t.forRange("i", d, o, (c) => {
        e.subschema({ keyword: "unevaluatedItems", dataProp: c, dataPropType: Ra.Type.Num }, i), s.allErrors || t.if((0, lt.not)(i), () => t.break());
      });
    }
  }
};
Cs.default = eh;
Object.defineProperty(As, "__esModule", { value: !0 });
const th = ks, rh = Cs, nh = [th.default, rh.default];
As.default = nh;
var Lr = {}, Ds = {};
Object.defineProperty(Ds, "__esModule", { value: !0 });
const re = U, sh = {
  message: ({ schemaCode: e }) => (0, re.str)`must match format "${e}"`,
  params: ({ schemaCode: e }) => (0, re._)`{format: ${e}}`
}, ah = {
  keyword: "format",
  type: ["number", "string"],
  schemaType: "string",
  $data: !0,
  error: sh,
  code(e, t) {
    const { gen: r, data: n, $data: s, schema: a, schemaCode: o, it: l } = e, { opts: i, errSchemaPath: d, schemaEnv: c, self: f } = l;
    if (!i.validateFormats)
      return;
    s ? _() : $();
    function _() {
      const E = r.scopeValue("formats", {
        ref: f.formats,
        code: i.code.formats
      }), y = r.const("fDef", (0, re._)`${E}[${o}]`), v = r.let("fType"), m = r.let("format");
      r.if((0, re._)`typeof ${y} == "object" && !(${y} instanceof RegExp)`, () => r.assign(v, (0, re._)`${y}.type || "string"`).assign(m, (0, re._)`${y}.validate`), () => r.assign(v, (0, re._)`"string"`).assign(m, y)), e.fail$data((0, re.or)(w(), R()));
      function w() {
        return i.strictSchema === !1 ? re.nil : (0, re._)`${o} && !${m}`;
      }
      function R() {
        const O = c.$async ? (0, re._)`(${y}.async ? await ${m}(${n}) : ${m}(${n}))` : (0, re._)`${m}(${n})`, j = (0, re._)`(typeof ${m} == "function" ? ${O} : ${m}.test(${n}))`;
        return (0, re._)`${m} && ${m} !== true && ${v} === ${t} && !${j}`;
      }
    }
    function $() {
      const E = f.formats[a];
      if (!E) {
        w();
        return;
      }
      if (E === !0)
        return;
      const [y, v, m] = R(E);
      y === t && e.pass(O());
      function w() {
        if (i.strictSchema === !1) {
          f.logger.warn(j());
          return;
        }
        throw new Error(j());
        function j() {
          return `unknown format "${a}" ignored in schema at path "${d}"`;
        }
      }
      function R(j) {
        const x = j instanceof RegExp ? (0, re.regexpCode)(j) : i.code.formats ? (0, re._)`${i.code.formats}${(0, re.getProperty)(a)}` : void 0, te = r.scopeValue("formats", { key: a, ref: j, code: x });
        return typeof j == "object" && !(j instanceof RegExp) ? [j.type || "string", j.validate, (0, re._)`${te}.validate`] : ["string", j, te];
      }
      function O() {
        if (typeof E == "object" && !(E instanceof RegExp) && E.async) {
          if (!c.$async)
            throw new Error("async format in sync schema");
          return (0, re._)`await ${m}(${n})`;
        }
        return typeof v == "function" ? (0, re._)`${m}(${n})` : (0, re._)`${m}.test(${n})`;
      }
    }
  }
};
Ds.default = ah;
Object.defineProperty(Lr, "__esModule", { value: !0 });
const oh = Ds, ih = [oh.default];
Lr.default = ih;
var mt = {};
Object.defineProperty(mt, "__esModule", { value: !0 });
mt.contentVocabulary = mt.metadataVocabulary = void 0;
mt.metadataVocabulary = [
  "title",
  "description",
  "default",
  "deprecated",
  "readOnly",
  "writeOnly",
  "examples"
];
mt.contentVocabulary = [
  "contentMediaType",
  "contentEncoding",
  "contentSchema"
];
Object.defineProperty(es, "__esModule", { value: !0 });
const ch = jr, lh = Ar, uh = kr, dh = Ps, fh = Ns, hh = As, mh = Lr, Ia = mt, ph = [
  dh.default,
  ch.default,
  lh.default,
  (0, uh.default)(!0),
  mh.default,
  Ia.metadataVocabulary,
  Ia.contentVocabulary,
  fh.default,
  hh.default
];
es.default = ph;
var Mr = {}, Vr = {};
Object.defineProperty(Vr, "__esModule", { value: !0 });
Vr.DiscrError = void 0;
var Na;
(function(e) {
  e.Tag = "tag", e.Mapping = "mapping";
})(Na || (Vr.DiscrError = Na = {}));
Object.defineProperty(Mr, "__esModule", { value: !0 });
const wt = U, An = Vr, Oa = me, $h = $t, yh = T, gh = {
  message: ({ params: { discrError: e, tagName: t } }) => e === An.DiscrError.Tag ? `tag "${t}" must be string` : `value of tag "${t}" must be in oneOf`,
  params: ({ params: { discrError: e, tag: t, tagName: r } }) => (0, wt._)`{error: ${e}, tag: ${r}, tagValue: ${t}}`
}, vh = {
  keyword: "discriminator",
  type: "object",
  schemaType: "object",
  error: gh,
  code(e) {
    const { gen: t, data: r, schema: n, parentSchema: s, it: a } = e, { oneOf: o } = s;
    if (!a.opts.discriminator)
      throw new Error("discriminator: requires discriminator option");
    const l = n.propertyName;
    if (typeof l != "string")
      throw new Error("discriminator: requires propertyName");
    if (n.mapping)
      throw new Error("discriminator: mapping is not supported");
    if (!o)
      throw new Error("discriminator: requires oneOf keyword");
    const i = t.let("valid", !1), d = t.const("tag", (0, wt._)`${r}${(0, wt.getProperty)(l)}`);
    t.if((0, wt._)`typeof ${d} == "string"`, () => c(), () => e.error(!1, { discrError: An.DiscrError.Tag, tag: d, tagName: l })), e.ok(i);
    function c() {
      const $ = _();
      t.if(!1);
      for (const E in $)
        t.elseIf((0, wt._)`${d} === ${E}`), t.assign(i, f($[E]));
      t.else(), e.error(!1, { discrError: An.DiscrError.Mapping, tag: d, tagName: l }), t.endIf();
    }
    function f($) {
      const E = t.name("valid"), y = e.subschema({ keyword: "oneOf", schemaProp: $ }, E);
      return e.mergeEvaluated(y, wt.Name), E;
    }
    function _() {
      var $;
      const E = {}, y = m(s);
      let v = !0;
      for (let O = 0; O < o.length; O++) {
        let j = o[O];
        if (j != null && j.$ref && !(0, yh.schemaHasRulesButRef)(j, a.self.RULES)) {
          const te = j.$ref;
          if (j = Oa.resolveRef.call(a.self, a.schemaEnv.root, a.baseId, te), j instanceof Oa.SchemaEnv && (j = j.schema), j === void 0)
            throw new $h.default(a.opts.uriResolver, a.baseId, te);
        }
        const x = ($ = j == null ? void 0 : j.properties) === null || $ === void 0 ? void 0 : $[l];
        if (typeof x != "object")
          throw new Error(`discriminator: oneOf subschemas (or referenced schemas) must have "properties/${l}"`);
        v = v && (y || m(j)), w(x, O);
      }
      if (!v)
        throw new Error(`discriminator: "${l}" must be required`);
      return E;
      function m({ required: O }) {
        return Array.isArray(O) && O.includes(l);
      }
      function w(O, j) {
        if (O.const)
          R(O.const, j);
        else if (O.enum)
          for (const x of O.enum)
            R(x, j);
        else
          throw new Error(`discriminator: "properties/${l}" must have "const" or "enum"`);
      }
      function R(O, j) {
        if (typeof O != "string" || O in E)
          throw new Error(`discriminator: "${l}" values must be unique strings`);
        E[O] = j;
      }
    }
  }
};
Mr.default = vh;
var Ls = {};
const _h = "https://json-schema.org/draft/2020-12/schema", Eh = "https://json-schema.org/draft/2020-12/schema", wh = {
  "https://json-schema.org/draft/2020-12/vocab/core": !0,
  "https://json-schema.org/draft/2020-12/vocab/applicator": !0,
  "https://json-schema.org/draft/2020-12/vocab/unevaluated": !0,
  "https://json-schema.org/draft/2020-12/vocab/validation": !0,
  "https://json-schema.org/draft/2020-12/vocab/meta-data": !0,
  "https://json-schema.org/draft/2020-12/vocab/format-annotation": !0,
  "https://json-schema.org/draft/2020-12/vocab/content": !0
}, Sh = "meta", bh = "Core and Validation specifications meta-schema", Ph = [
  {
    $ref: "meta/core"
  },
  {
    $ref: "meta/applicator"
  },
  {
    $ref: "meta/unevaluated"
  },
  {
    $ref: "meta/validation"
  },
  {
    $ref: "meta/meta-data"
  },
  {
    $ref: "meta/format-annotation"
  },
  {
    $ref: "meta/content"
  }
], Rh = [
  "object",
  "boolean"
], Ih = "This meta-schema also defines keywords that have appeared in previous drafts in order to prevent incompatible extensions as they remain in common use.", Nh = {
  definitions: {
    $comment: '"definitions" has been replaced by "$defs".',
    type: "object",
    additionalProperties: {
      $dynamicRef: "#meta"
    },
    deprecated: !0,
    default: {}
  },
  dependencies: {
    $comment: '"dependencies" has been split and replaced by "dependentSchemas" and "dependentRequired" in order to serve their differing semantics.',
    type: "object",
    additionalProperties: {
      anyOf: [
        {
          $dynamicRef: "#meta"
        },
        {
          $ref: "meta/validation#/$defs/stringArray"
        }
      ]
    },
    deprecated: !0,
    default: {}
  },
  $recursiveAnchor: {
    $comment: '"$recursiveAnchor" has been replaced by "$dynamicAnchor".',
    $ref: "meta/core#/$defs/anchorString",
    deprecated: !0
  },
  $recursiveRef: {
    $comment: '"$recursiveRef" has been replaced by "$dynamicRef".',
    $ref: "meta/core#/$defs/uriReferenceString",
    deprecated: !0
  }
}, Oh = {
  $schema: _h,
  $id: Eh,
  $vocabulary: wh,
  $dynamicAnchor: Sh,
  title: bh,
  allOf: Ph,
  type: Rh,
  $comment: Ih,
  properties: Nh
}, Th = "https://json-schema.org/draft/2020-12/schema", jh = "https://json-schema.org/draft/2020-12/meta/applicator", Ah = {
  "https://json-schema.org/draft/2020-12/vocab/applicator": !0
}, kh = "meta", Ch = "Applicator vocabulary meta-schema", Dh = [
  "object",
  "boolean"
], Lh = {
  prefixItems: {
    $ref: "#/$defs/schemaArray"
  },
  items: {
    $dynamicRef: "#meta"
  },
  contains: {
    $dynamicRef: "#meta"
  },
  additionalProperties: {
    $dynamicRef: "#meta"
  },
  properties: {
    type: "object",
    additionalProperties: {
      $dynamicRef: "#meta"
    },
    default: {}
  },
  patternProperties: {
    type: "object",
    additionalProperties: {
      $dynamicRef: "#meta"
    },
    propertyNames: {
      format: "regex"
    },
    default: {}
  },
  dependentSchemas: {
    type: "object",
    additionalProperties: {
      $dynamicRef: "#meta"
    },
    default: {}
  },
  propertyNames: {
    $dynamicRef: "#meta"
  },
  if: {
    $dynamicRef: "#meta"
  },
  then: {
    $dynamicRef: "#meta"
  },
  else: {
    $dynamicRef: "#meta"
  },
  allOf: {
    $ref: "#/$defs/schemaArray"
  },
  anyOf: {
    $ref: "#/$defs/schemaArray"
  },
  oneOf: {
    $ref: "#/$defs/schemaArray"
  },
  not: {
    $dynamicRef: "#meta"
  }
}, Mh = {
  schemaArray: {
    type: "array",
    minItems: 1,
    items: {
      $dynamicRef: "#meta"
    }
  }
}, Vh = {
  $schema: Th,
  $id: jh,
  $vocabulary: Ah,
  $dynamicAnchor: kh,
  title: Ch,
  type: Dh,
  properties: Lh,
  $defs: Mh
}, zh = "https://json-schema.org/draft/2020-12/schema", Fh = "https://json-schema.org/draft/2020-12/meta/unevaluated", Uh = {
  "https://json-schema.org/draft/2020-12/vocab/unevaluated": !0
}, qh = "meta", Gh = "Unevaluated applicator vocabulary meta-schema", Kh = [
  "object",
  "boolean"
], Hh = {
  unevaluatedItems: {
    $dynamicRef: "#meta"
  },
  unevaluatedProperties: {
    $dynamicRef: "#meta"
  }
}, Xh = {
  $schema: zh,
  $id: Fh,
  $vocabulary: Uh,
  $dynamicAnchor: qh,
  title: Gh,
  type: Kh,
  properties: Hh
}, Wh = "https://json-schema.org/draft/2020-12/schema", Bh = "https://json-schema.org/draft/2020-12/meta/content", xh = {
  "https://json-schema.org/draft/2020-12/vocab/content": !0
}, Jh = "meta", Yh = "Content vocabulary meta-schema", Zh = [
  "object",
  "boolean"
], Qh = {
  contentEncoding: {
    type: "string"
  },
  contentMediaType: {
    type: "string"
  },
  contentSchema: {
    $dynamicRef: "#meta"
  }
}, em = {
  $schema: Wh,
  $id: Bh,
  $vocabulary: xh,
  $dynamicAnchor: Jh,
  title: Yh,
  type: Zh,
  properties: Qh
}, tm = "https://json-schema.org/draft/2020-12/schema", rm = "https://json-schema.org/draft/2020-12/meta/core", nm = {
  "https://json-schema.org/draft/2020-12/vocab/core": !0
}, sm = "meta", am = "Core vocabulary meta-schema", om = [
  "object",
  "boolean"
], im = {
  $id: {
    $ref: "#/$defs/uriReferenceString",
    $comment: "Non-empty fragments not allowed.",
    pattern: "^[^#]*#?$"
  },
  $schema: {
    $ref: "#/$defs/uriString"
  },
  $ref: {
    $ref: "#/$defs/uriReferenceString"
  },
  $anchor: {
    $ref: "#/$defs/anchorString"
  },
  $dynamicRef: {
    $ref: "#/$defs/uriReferenceString"
  },
  $dynamicAnchor: {
    $ref: "#/$defs/anchorString"
  },
  $vocabulary: {
    type: "object",
    propertyNames: {
      $ref: "#/$defs/uriString"
    },
    additionalProperties: {
      type: "boolean"
    }
  },
  $comment: {
    type: "string"
  },
  $defs: {
    type: "object",
    additionalProperties: {
      $dynamicRef: "#meta"
    }
  }
}, cm = {
  anchorString: {
    type: "string",
    pattern: "^[A-Za-z_][-A-Za-z0-9._]*$"
  },
  uriString: {
    type: "string",
    format: "uri"
  },
  uriReferenceString: {
    type: "string",
    format: "uri-reference"
  }
}, lm = {
  $schema: tm,
  $id: rm,
  $vocabulary: nm,
  $dynamicAnchor: sm,
  title: am,
  type: om,
  properties: im,
  $defs: cm
}, um = "https://json-schema.org/draft/2020-12/schema", dm = "https://json-schema.org/draft/2020-12/meta/format-annotation", fm = {
  "https://json-schema.org/draft/2020-12/vocab/format-annotation": !0
}, hm = "meta", mm = "Format vocabulary meta-schema for annotation results", pm = [
  "object",
  "boolean"
], $m = {
  format: {
    type: "string"
  }
}, ym = {
  $schema: um,
  $id: dm,
  $vocabulary: fm,
  $dynamicAnchor: hm,
  title: mm,
  type: pm,
  properties: $m
}, gm = "https://json-schema.org/draft/2020-12/schema", vm = "https://json-schema.org/draft/2020-12/meta/meta-data", _m = {
  "https://json-schema.org/draft/2020-12/vocab/meta-data": !0
}, Em = "meta", wm = "Meta-data vocabulary meta-schema", Sm = [
  "object",
  "boolean"
], bm = {
  title: {
    type: "string"
  },
  description: {
    type: "string"
  },
  default: !0,
  deprecated: {
    type: "boolean",
    default: !1
  },
  readOnly: {
    type: "boolean",
    default: !1
  },
  writeOnly: {
    type: "boolean",
    default: !1
  },
  examples: {
    type: "array",
    items: !0
  }
}, Pm = {
  $schema: gm,
  $id: vm,
  $vocabulary: _m,
  $dynamicAnchor: Em,
  title: wm,
  type: Sm,
  properties: bm
}, Rm = "https://json-schema.org/draft/2020-12/schema", Im = "https://json-schema.org/draft/2020-12/meta/validation", Nm = {
  "https://json-schema.org/draft/2020-12/vocab/validation": !0
}, Om = "meta", Tm = "Validation vocabulary meta-schema", jm = [
  "object",
  "boolean"
], Am = {
  type: {
    anyOf: [
      {
        $ref: "#/$defs/simpleTypes"
      },
      {
        type: "array",
        items: {
          $ref: "#/$defs/simpleTypes"
        },
        minItems: 1,
        uniqueItems: !0
      }
    ]
  },
  const: !0,
  enum: {
    type: "array",
    items: !0
  },
  multipleOf: {
    type: "number",
    exclusiveMinimum: 0
  },
  maximum: {
    type: "number"
  },
  exclusiveMaximum: {
    type: "number"
  },
  minimum: {
    type: "number"
  },
  exclusiveMinimum: {
    type: "number"
  },
  maxLength: {
    $ref: "#/$defs/nonNegativeInteger"
  },
  minLength: {
    $ref: "#/$defs/nonNegativeIntegerDefault0"
  },
  pattern: {
    type: "string",
    format: "regex"
  },
  maxItems: {
    $ref: "#/$defs/nonNegativeInteger"
  },
  minItems: {
    $ref: "#/$defs/nonNegativeIntegerDefault0"
  },
  uniqueItems: {
    type: "boolean",
    default: !1
  },
  maxContains: {
    $ref: "#/$defs/nonNegativeInteger"
  },
  minContains: {
    $ref: "#/$defs/nonNegativeInteger",
    default: 1
  },
  maxProperties: {
    $ref: "#/$defs/nonNegativeInteger"
  },
  minProperties: {
    $ref: "#/$defs/nonNegativeIntegerDefault0"
  },
  required: {
    $ref: "#/$defs/stringArray"
  },
  dependentRequired: {
    type: "object",
    additionalProperties: {
      $ref: "#/$defs/stringArray"
    }
  }
}, km = {
  nonNegativeInteger: {
    type: "integer",
    minimum: 0
  },
  nonNegativeIntegerDefault0: {
    $ref: "#/$defs/nonNegativeInteger",
    default: 0
  },
  simpleTypes: {
    enum: [
      "array",
      "boolean",
      "integer",
      "null",
      "number",
      "object",
      "string"
    ]
  },
  stringArray: {
    type: "array",
    items: {
      type: "string"
    },
    uniqueItems: !0,
    default: []
  }
}, Cm = {
  $schema: Rm,
  $id: Im,
  $vocabulary: Nm,
  $dynamicAnchor: Om,
  title: Tm,
  type: jm,
  properties: Am,
  $defs: km
};
Object.defineProperty(Ls, "__esModule", { value: !0 });
const Dm = Oh, Lm = Vh, Mm = Xh, Vm = em, zm = lm, Fm = ym, Um = Pm, qm = Cm, Gm = ["/properties"];
function Km(e) {
  return [
    Dm,
    Lm,
    Mm,
    Vm,
    zm,
    t(this, Fm),
    Um,
    t(this, qm)
  ].forEach((r) => this.addMetaSchema(r, void 0, !1)), this;
  function t(r, n) {
    return e ? r.$dataMetaSchema(n, Gm) : n;
  }
}
Ls.default = Km;
(function(e, t) {
  Object.defineProperty(t, "__esModule", { value: !0 }), t.MissingRefError = t.ValidationError = t.CodeGen = t.Name = t.nil = t.stringify = t.str = t._ = t.KeywordCxt = t.Ajv2020 = void 0;
  const r = Fn, n = es, s = Mr, a = Ls, o = "https://json-schema.org/draft/2020-12/schema";
  class l extends r.default {
    constructor($ = {}) {
      super({
        ...$,
        dynamicRef: !0,
        next: !0,
        unevaluated: !0
      });
    }
    _addVocabularies() {
      super._addVocabularies(), n.default.forEach(($) => this.addVocabulary($)), this.opts.discriminator && this.addKeyword(s.default);
    }
    _addDefaultMetaSchema() {
      super._addDefaultMetaSchema();
      const { $data: $, meta: E } = this.opts;
      E && (a.default.call(this, $), this.refs["http://json-schema.org/schema"] = o);
    }
    defaultMeta() {
      return this.opts.defaultMeta = super.defaultMeta() || (this.getSchema(o) ? o : void 0);
    }
  }
  t.Ajv2020 = l, e.exports = t = l, e.exports.Ajv2020 = l, Object.defineProperty(t, "__esModule", { value: !0 }), t.default = l;
  var i = Pe;
  Object.defineProperty(t, "KeywordCxt", { enumerable: !0, get: function() {
    return i.KeywordCxt;
  } });
  var d = U;
  Object.defineProperty(t, "_", { enumerable: !0, get: function() {
    return d._;
  } }), Object.defineProperty(t, "str", { enumerable: !0, get: function() {
    return d.str;
  } }), Object.defineProperty(t, "stringify", { enumerable: !0, get: function() {
    return d.stringify;
  } }), Object.defineProperty(t, "nil", { enumerable: !0, get: function() {
    return d.nil;
  } }), Object.defineProperty(t, "Name", { enumerable: !0, get: function() {
    return d.Name;
  } }), Object.defineProperty(t, "CodeGen", { enumerable: !0, get: function() {
    return d.CodeGen;
  } });
  var c = Nt;
  Object.defineProperty(t, "ValidationError", { enumerable: !0, get: function() {
    return c.default;
  } });
  var f = $t;
  Object.defineProperty(t, "MissingRefError", { enumerable: !0, get: function() {
    return f.default;
  } });
})(Pn, Pn.exports);
var Hm = Pn.exports, kn = { exports: {} }, ii = {};
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.formatNames = e.fastFormats = e.fullFormats = void 0;
  function t(z, K) {
    return { validate: z, compare: K };
  }
  e.fullFormats = {
    // date: http://tools.ietf.org/html/rfc3339#section-5.6
    date: t(a, o),
    // date-time: http://tools.ietf.org/html/rfc3339#section-5.6
    time: t(i(!0), d),
    "date-time": t(_(!0), $),
    "iso-time": t(i(), c),
    "iso-date-time": t(_(), E),
    // duration: https://tools.ietf.org/html/rfc3339#appendix-A
    duration: /^P(?!$)((\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+S)?)?|(\d+W)?)$/,
    uri: m,
    "uri-reference": /^(?:[a-z][a-z0-9+\-.]*:)?(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'"()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?(?:\?(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i,
    // uri-template: https://tools.ietf.org/html/rfc6570
    "uri-template": /^(?:(?:[^\x00-\x20"'<>%\\^`{|}]|%[0-9a-f]{2})|\{[+#./;?&=,!@|]?(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?(?:,(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?)*\})*$/i,
    // For the source: https://gist.github.com/dperini/729294
    // For test cases: https://mathiasbynens.be/demo/url-regex
    url: /^(?:https?|ftp):\/\/(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)(?:\.(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)*(?:\.(?:[a-z\u{00a1}-\u{ffff}]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/iu,
    email: /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i,
    hostname: /^(?=.{1,253}\.?$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[-0-9a-z]{0,61}[0-9a-z])?)*\.?$/i,
    // optimized https://www.safaribooksonline.com/library/view/regular-expressions-cookbook/9780596802837/ch07s16.html
    ipv4: /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/,
    ipv6: /^((([0-9a-f]{1,4}:){7}([0-9a-f]{1,4}|:))|(([0-9a-f]{1,4}:){6}(:[0-9a-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){5}(((:[0-9a-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){4}(((:[0-9a-f]{1,4}){1,3})|((:[0-9a-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){3}(((:[0-9a-f]{1,4}){1,4})|((:[0-9a-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){2}(((:[0-9a-f]{1,4}){1,5})|((:[0-9a-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){1}(((:[0-9a-f]{1,4}){1,6})|((:[0-9a-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9a-f]{1,4}){1,7})|((:[0-9a-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))$/i,
    regex: Re,
    // uuid: http://tools.ietf.org/html/rfc4122
    uuid: /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i,
    // JSON-pointer: https://tools.ietf.org/html/rfc6901
    // uri fragment: https://tools.ietf.org/html/rfc3986#appendix-A
    "json-pointer": /^(?:\/(?:[^~/]|~0|~1)*)*$/,
    "json-pointer-uri-fragment": /^#(?:\/(?:[a-z0-9_\-.!$&'()*+,;:=@]|%[0-9a-f]{2}|~0|~1)*)*$/i,
    // relative JSON-pointer: http://tools.ietf.org/html/draft-luff-relative-json-pointer-00
    "relative-json-pointer": /^(?:0|[1-9][0-9]*)(?:#|(?:\/(?:[^~/]|~0|~1)*)*)$/,
    // the following formats are used by the openapi specification: https://spec.openapis.org/oas/v3.0.0#data-types
    // byte: https://github.com/miguelmota/is-base64
    byte: R,
    // signed 32 bit integer
    int32: { type: "number", validate: x },
    // signed 64 bit integer
    int64: { type: "number", validate: te },
    // C-type float
    float: { type: "number", validate: $e },
    // C-type double
    double: { type: "number", validate: $e },
    // hint to the UI to hide input strings
    password: !0,
    // unchecked string payload
    binary: !0
  }, e.fastFormats = {
    ...e.fullFormats,
    date: t(/^\d\d\d\d-[0-1]\d-[0-3]\d$/, o),
    time: t(/^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i, d),
    "date-time": t(/^\d\d\d\d-[0-1]\d-[0-3]\dt(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i, $),
    "iso-time": t(/^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i, c),
    "iso-date-time": t(/^\d\d\d\d-[0-1]\d-[0-3]\d[t\s](?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i, E),
    // uri: https://github.com/mafintosh/is-my-json-valid/blob/master/formats.js
    uri: /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/)?[^\s]*$/i,
    "uri-reference": /^(?:(?:[a-z][a-z0-9+\-.]*:)?\/?\/)?(?:[^\\\s#][^\s#]*)?(?:#[^\\\s]*)?$/i,
    // email (sources from jsen validator):
    // http://stackoverflow.com/questions/201323/using-a-regular-expression-to-validate-an-email-address#answer-8829363
    // http://www.w3.org/TR/html5/forms.html#valid-e-mail-address (search for 'wilful violation')
    email: /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i
  }, e.formatNames = Object.keys(e.fullFormats);
  function r(z) {
    return z % 4 === 0 && (z % 100 !== 0 || z % 400 === 0);
  }
  const n = /^(\d\d\d\d)-(\d\d)-(\d\d)$/, s = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  function a(z) {
    const K = n.exec(z);
    if (!K)
      return !1;
    const Z = +K[1], I = +K[2], N = +K[3];
    return I >= 1 && I <= 12 && N >= 1 && N <= (I === 2 && r(Z) ? 29 : s[I]);
  }
  function o(z, K) {
    if (z && K)
      return z > K ? 1 : z < K ? -1 : 0;
  }
  const l = /^(\d\d):(\d\d):(\d\d(?:\.\d+)?)(z|([+-])(\d\d)(?::?(\d\d))?)?$/i;
  function i(z) {
    return function(Z) {
      const I = l.exec(Z);
      if (!I)
        return !1;
      const N = +I[1], C = +I[2], A = +I[3], V = I[4], k = I[5] === "-" ? -1 : 1, P = +(I[6] || 0), p = +(I[7] || 0);
      if (P > 23 || p > 59 || z && !V)
        return !1;
      if (N <= 23 && C <= 59 && A < 60)
        return !0;
      const S = C - p * k, g = N - P * k - (S < 0 ? 1 : 0);
      return (g === 23 || g === -1) && (S === 59 || S === -1) && A < 61;
    };
  }
  function d(z, K) {
    if (!(z && K))
      return;
    const Z = (/* @__PURE__ */ new Date("2020-01-01T" + z)).valueOf(), I = (/* @__PURE__ */ new Date("2020-01-01T" + K)).valueOf();
    if (Z && I)
      return Z - I;
  }
  function c(z, K) {
    if (!(z && K))
      return;
    const Z = l.exec(z), I = l.exec(K);
    if (Z && I)
      return z = Z[1] + Z[2] + Z[3], K = I[1] + I[2] + I[3], z > K ? 1 : z < K ? -1 : 0;
  }
  const f = /t|\s/i;
  function _(z) {
    const K = i(z);
    return function(I) {
      const N = I.split(f);
      return N.length === 2 && a(N[0]) && K(N[1]);
    };
  }
  function $(z, K) {
    if (!(z && K))
      return;
    const Z = new Date(z).valueOf(), I = new Date(K).valueOf();
    if (Z && I)
      return Z - I;
  }
  function E(z, K) {
    if (!(z && K))
      return;
    const [Z, I] = z.split(f), [N, C] = K.split(f), A = o(Z, N);
    if (A !== void 0)
      return A || d(I, C);
  }
  const y = /\/|:/, v = /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)(?:\?(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
  function m(z) {
    return y.test(z) && v.test(z);
  }
  const w = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/gm;
  function R(z) {
    return w.lastIndex = 0, w.test(z);
  }
  const O = -2147483648, j = 2 ** 31 - 1;
  function x(z) {
    return Number.isInteger(z) && z <= j && z >= O;
  }
  function te(z) {
    return Number.isInteger(z);
  }
  function $e() {
    return !0;
  }
  const we = /[^\\]\\Z/;
  function Re(z) {
    if (we.test(z))
      return !1;
    try {
      return new RegExp(z), !0;
    } catch {
      return !1;
    }
  }
})(ii);
var ci = {}, Cn = { exports: {} }, Ms = {};
Object.defineProperty(Ms, "__esModule", { value: !0 });
const Xm = jr, Wm = Ar, Bm = kr, xm = Lr, Ta = mt, Jm = [
  Xm.default,
  Wm.default,
  (0, Bm.default)(),
  xm.default,
  Ta.metadataVocabulary,
  Ta.contentVocabulary
];
Ms.default = Jm;
const Ym = "http://json-schema.org/draft-07/schema#", Zm = "http://json-schema.org/draft-07/schema#", Qm = "Core schema meta-schema", ep = {
  schemaArray: {
    type: "array",
    minItems: 1,
    items: {
      $ref: "#"
    }
  },
  nonNegativeInteger: {
    type: "integer",
    minimum: 0
  },
  nonNegativeIntegerDefault0: {
    allOf: [
      {
        $ref: "#/definitions/nonNegativeInteger"
      },
      {
        default: 0
      }
    ]
  },
  simpleTypes: {
    enum: [
      "array",
      "boolean",
      "integer",
      "null",
      "number",
      "object",
      "string"
    ]
  },
  stringArray: {
    type: "array",
    items: {
      type: "string"
    },
    uniqueItems: !0,
    default: []
  }
}, tp = [
  "object",
  "boolean"
], rp = {
  $id: {
    type: "string",
    format: "uri-reference"
  },
  $schema: {
    type: "string",
    format: "uri"
  },
  $ref: {
    type: "string",
    format: "uri-reference"
  },
  $comment: {
    type: "string"
  },
  title: {
    type: "string"
  },
  description: {
    type: "string"
  },
  default: !0,
  readOnly: {
    type: "boolean",
    default: !1
  },
  examples: {
    type: "array",
    items: !0
  },
  multipleOf: {
    type: "number",
    exclusiveMinimum: 0
  },
  maximum: {
    type: "number"
  },
  exclusiveMaximum: {
    type: "number"
  },
  minimum: {
    type: "number"
  },
  exclusiveMinimum: {
    type: "number"
  },
  maxLength: {
    $ref: "#/definitions/nonNegativeInteger"
  },
  minLength: {
    $ref: "#/definitions/nonNegativeIntegerDefault0"
  },
  pattern: {
    type: "string",
    format: "regex"
  },
  additionalItems: {
    $ref: "#"
  },
  items: {
    anyOf: [
      {
        $ref: "#"
      },
      {
        $ref: "#/definitions/schemaArray"
      }
    ],
    default: !0
  },
  maxItems: {
    $ref: "#/definitions/nonNegativeInteger"
  },
  minItems: {
    $ref: "#/definitions/nonNegativeIntegerDefault0"
  },
  uniqueItems: {
    type: "boolean",
    default: !1
  },
  contains: {
    $ref: "#"
  },
  maxProperties: {
    $ref: "#/definitions/nonNegativeInteger"
  },
  minProperties: {
    $ref: "#/definitions/nonNegativeIntegerDefault0"
  },
  required: {
    $ref: "#/definitions/stringArray"
  },
  additionalProperties: {
    $ref: "#"
  },
  definitions: {
    type: "object",
    additionalProperties: {
      $ref: "#"
    },
    default: {}
  },
  properties: {
    type: "object",
    additionalProperties: {
      $ref: "#"
    },
    default: {}
  },
  patternProperties: {
    type: "object",
    additionalProperties: {
      $ref: "#"
    },
    propertyNames: {
      format: "regex"
    },
    default: {}
  },
  dependencies: {
    type: "object",
    additionalProperties: {
      anyOf: [
        {
          $ref: "#"
        },
        {
          $ref: "#/definitions/stringArray"
        }
      ]
    }
  },
  propertyNames: {
    $ref: "#"
  },
  const: !0,
  enum: {
    type: "array",
    items: !0,
    minItems: 1,
    uniqueItems: !0
  },
  type: {
    anyOf: [
      {
        $ref: "#/definitions/simpleTypes"
      },
      {
        type: "array",
        items: {
          $ref: "#/definitions/simpleTypes"
        },
        minItems: 1,
        uniqueItems: !0
      }
    ]
  },
  format: {
    type: "string"
  },
  contentMediaType: {
    type: "string"
  },
  contentEncoding: {
    type: "string"
  },
  if: {
    $ref: "#"
  },
  then: {
    $ref: "#"
  },
  else: {
    $ref: "#"
  },
  allOf: {
    $ref: "#/definitions/schemaArray"
  },
  anyOf: {
    $ref: "#/definitions/schemaArray"
  },
  oneOf: {
    $ref: "#/definitions/schemaArray"
  },
  not: {
    $ref: "#"
  }
}, np = {
  $schema: Ym,
  $id: Zm,
  title: Qm,
  definitions: ep,
  type: tp,
  properties: rp,
  default: !0
};
(function(e, t) {
  Object.defineProperty(t, "__esModule", { value: !0 }), t.MissingRefError = t.ValidationError = t.CodeGen = t.Name = t.nil = t.stringify = t.str = t._ = t.KeywordCxt = t.Ajv = void 0;
  const r = Fn, n = Ms, s = Mr, a = np, o = ["/properties"], l = "http://json-schema.org/draft-07/schema";
  class i extends r.default {
    _addVocabularies() {
      super._addVocabularies(), n.default.forEach((E) => this.addVocabulary(E)), this.opts.discriminator && this.addKeyword(s.default);
    }
    _addDefaultMetaSchema() {
      if (super._addDefaultMetaSchema(), !this.opts.meta)
        return;
      const E = this.opts.$data ? this.$dataMetaSchema(a, o) : a;
      this.addMetaSchema(E, l, !1), this.refs["http://json-schema.org/schema"] = l;
    }
    defaultMeta() {
      return this.opts.defaultMeta = super.defaultMeta() || (this.getSchema(l) ? l : void 0);
    }
  }
  t.Ajv = i, e.exports = t = i, e.exports.Ajv = i, Object.defineProperty(t, "__esModule", { value: !0 }), t.default = i;
  var d = Pe;
  Object.defineProperty(t, "KeywordCxt", { enumerable: !0, get: function() {
    return d.KeywordCxt;
  } });
  var c = U;
  Object.defineProperty(t, "_", { enumerable: !0, get: function() {
    return c._;
  } }), Object.defineProperty(t, "str", { enumerable: !0, get: function() {
    return c.str;
  } }), Object.defineProperty(t, "stringify", { enumerable: !0, get: function() {
    return c.stringify;
  } }), Object.defineProperty(t, "nil", { enumerable: !0, get: function() {
    return c.nil;
  } }), Object.defineProperty(t, "Name", { enumerable: !0, get: function() {
    return c.Name;
  } }), Object.defineProperty(t, "CodeGen", { enumerable: !0, get: function() {
    return c.CodeGen;
  } });
  var f = Nt;
  Object.defineProperty(t, "ValidationError", { enumerable: !0, get: function() {
    return f.default;
  } });
  var _ = $t;
  Object.defineProperty(t, "MissingRefError", { enumerable: !0, get: function() {
    return _.default;
  } });
})(Cn, Cn.exports);
var sp = Cn.exports;
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.formatLimitDefinition = void 0;
  const t = sp, r = U, n = r.operators, s = {
    formatMaximum: { okStr: "<=", ok: n.LTE, fail: n.GT },
    formatMinimum: { okStr: ">=", ok: n.GTE, fail: n.LT },
    formatExclusiveMaximum: { okStr: "<", ok: n.LT, fail: n.GTE },
    formatExclusiveMinimum: { okStr: ">", ok: n.GT, fail: n.LTE }
  }, a = {
    message: ({ keyword: l, schemaCode: i }) => (0, r.str)`should be ${s[l].okStr} ${i}`,
    params: ({ keyword: l, schemaCode: i }) => (0, r._)`{comparison: ${s[l].okStr}, limit: ${i}}`
  };
  e.formatLimitDefinition = {
    keyword: Object.keys(s),
    type: "string",
    schemaType: "string",
    $data: !0,
    error: a,
    code(l) {
      const { gen: i, data: d, schemaCode: c, keyword: f, it: _ } = l, { opts: $, self: E } = _;
      if (!$.validateFormats)
        return;
      const y = new t.KeywordCxt(_, E.RULES.all.format.definition, "format");
      y.$data ? v() : m();
      function v() {
        const R = i.scopeValue("formats", {
          ref: E.formats,
          code: $.code.formats
        }), O = i.const("fmt", (0, r._)`${R}[${y.schemaCode}]`);
        l.fail$data((0, r.or)((0, r._)`typeof ${O} != "object"`, (0, r._)`${O} instanceof RegExp`, (0, r._)`typeof ${O}.compare != "function"`, w(O)));
      }
      function m() {
        const R = y.schema, O = E.formats[R];
        if (!O || O === !0)
          return;
        if (typeof O != "object" || O instanceof RegExp || typeof O.compare != "function")
          throw new Error(`"${f}": format "${R}" does not define "compare" function`);
        const j = i.scopeValue("formats", {
          key: R,
          ref: O,
          code: $.code.formats ? (0, r._)`${$.code.formats}${(0, r.getProperty)(R)}` : void 0
        });
        l.fail$data(w(j));
      }
      function w(R) {
        return (0, r._)`${R}.compare(${d}, ${c}) ${s[f].fail} 0`;
      }
    },
    dependencies: ["format"]
  };
  const o = (l) => (l.addKeyword(e.formatLimitDefinition), l);
  e.default = o;
})(ci);
(function(e, t) {
  Object.defineProperty(t, "__esModule", { value: !0 });
  const r = ii, n = ci, s = U, a = new s.Name("fullFormats"), o = new s.Name("fastFormats"), l = (d, c = { keywords: !0 }) => {
    if (Array.isArray(c))
      return i(d, c, r.fullFormats, a), d;
    const [f, _] = c.mode === "fast" ? [r.fastFormats, o] : [r.fullFormats, a], $ = c.formats || r.formatNames;
    return i(d, $, f, _), c.keywords && (0, n.default)(d), d;
  };
  l.get = (d, c = "full") => {
    const _ = (c === "fast" ? r.fastFormats : r.fullFormats)[d];
    if (!_)
      throw new Error(`Unknown format "${d}"`);
    return _;
  };
  function i(d, c, f, _) {
    var $, E;
    ($ = (E = d.opts.code).formats) !== null && $ !== void 0 || (E.formats = (0, s._)`require("ajv-formats/dist/formats").${_}`);
    for (const y of c)
      d.addFormat(y, f[y]);
  }
  e.exports = t = l, Object.defineProperty(t, "__esModule", { value: !0 }), t.default = l;
})(kn, kn.exports);
var ap = kn.exports;
const op = /* @__PURE__ */ io(ap), ip = (e, t, r, n) => {
  if (r === "length" || r === "prototype" || r === "arguments" || r === "caller")
    return;
  const s = Object.getOwnPropertyDescriptor(e, r), a = Object.getOwnPropertyDescriptor(t, r);
  !cp(s, a) && n || Object.defineProperty(e, r, a);
}, cp = function(e, t) {
  return e === void 0 || e.configurable || e.writable === t.writable && e.enumerable === t.enumerable && e.configurable === t.configurable && (e.writable || e.value === t.value);
}, lp = (e, t) => {
  const r = Object.getPrototypeOf(t);
  r !== Object.getPrototypeOf(e) && Object.setPrototypeOf(e, r);
}, up = (e, t) => `/* Wrapped ${e}*/
${t}`, dp = Object.getOwnPropertyDescriptor(Function.prototype, "toString"), fp = Object.getOwnPropertyDescriptor(Function.prototype.toString, "name"), hp = (e, t, r) => {
  const n = r === "" ? "" : `with ${r.trim()}() `, s = up.bind(null, n, t.toString());
  Object.defineProperty(s, "name", fp);
  const { writable: a, enumerable: o, configurable: l } = dp;
  Object.defineProperty(e, "toString", { value: s, writable: a, enumerable: o, configurable: l });
};
function mp(e, t, { ignoreNonConfigurable: r = !1 } = {}) {
  const { name: n } = e;
  for (const s of Reflect.ownKeys(t))
    ip(e, t, s, r);
  return lp(e, t), hp(e, t, n), e;
}
const ja = (e, t = {}) => {
  if (typeof e != "function")
    throw new TypeError(`Expected the first argument to be a function, got \`${typeof e}\``);
  const {
    wait: r = 0,
    maxWait: n = Number.POSITIVE_INFINITY,
    before: s = !1,
    after: a = !0
  } = t;
  if (r < 0 || n < 0)
    throw new RangeError("`wait` and `maxWait` must not be negative.");
  if (!s && !a)
    throw new Error("Both `before` and `after` are false, function wouldn't be called.");
  let o, l, i;
  const d = function(...c) {
    const f = this, _ = () => {
      o = void 0, l && (clearTimeout(l), l = void 0), a && (i = e.apply(f, c));
    }, $ = () => {
      l = void 0, o && (clearTimeout(o), o = void 0), a && (i = e.apply(f, c));
    }, E = s && !o;
    return clearTimeout(o), o = setTimeout(_, r), n > 0 && n !== Number.POSITIVE_INFINITY && !l && (l = setTimeout($, n)), E && (i = e.apply(f, c)), i;
  };
  return mp(d, e), d.cancel = () => {
    o && (clearTimeout(o), o = void 0), l && (clearTimeout(l), l = void 0);
  }, d;
};
var Dn = { exports: {} };
const pp = "2.0.0", li = 256, $p = Number.MAX_SAFE_INTEGER || /* istanbul ignore next */
9007199254740991, yp = 16, gp = li - 6, vp = [
  "major",
  "premajor",
  "minor",
  "preminor",
  "patch",
  "prepatch",
  "prerelease"
];
var zr = {
  MAX_LENGTH: li,
  MAX_SAFE_COMPONENT_LENGTH: yp,
  MAX_SAFE_BUILD_LENGTH: gp,
  MAX_SAFE_INTEGER: $p,
  RELEASE_TYPES: vp,
  SEMVER_SPEC_VERSION: pp,
  FLAG_INCLUDE_PRERELEASE: 1,
  FLAG_LOOSE: 2
};
const _p = typeof process == "object" && process.env && process.env.NODE_DEBUG && /\bsemver\b/i.test(process.env.NODE_DEBUG) ? (...e) => console.error("SEMVER", ...e) : () => {
};
var Fr = _p;
(function(e, t) {
  const {
    MAX_SAFE_COMPONENT_LENGTH: r,
    MAX_SAFE_BUILD_LENGTH: n,
    MAX_LENGTH: s
  } = zr, a = Fr;
  t = e.exports = {};
  const o = t.re = [], l = t.safeRe = [], i = t.src = [], d = t.safeSrc = [], c = t.t = {};
  let f = 0;
  const _ = "[a-zA-Z0-9-]", $ = [
    ["\\s", 1],
    ["\\d", s],
    [_, n]
  ], E = (v) => {
    for (const [m, w] of $)
      v = v.split(`${m}*`).join(`${m}{0,${w}}`).split(`${m}+`).join(`${m}{1,${w}}`);
    return v;
  }, y = (v, m, w) => {
    const R = E(m), O = f++;
    a(v, O, m), c[v] = O, i[O] = m, d[O] = R, o[O] = new RegExp(m, w ? "g" : void 0), l[O] = new RegExp(R, w ? "g" : void 0);
  };
  y("NUMERICIDENTIFIER", "0|[1-9]\\d*"), y("NUMERICIDENTIFIERLOOSE", "\\d+"), y("NONNUMERICIDENTIFIER", `\\d*[a-zA-Z-]${_}*`), y("MAINVERSION", `(${i[c.NUMERICIDENTIFIER]})\\.(${i[c.NUMERICIDENTIFIER]})\\.(${i[c.NUMERICIDENTIFIER]})`), y("MAINVERSIONLOOSE", `(${i[c.NUMERICIDENTIFIERLOOSE]})\\.(${i[c.NUMERICIDENTIFIERLOOSE]})\\.(${i[c.NUMERICIDENTIFIERLOOSE]})`), y("PRERELEASEIDENTIFIER", `(?:${i[c.NONNUMERICIDENTIFIER]}|${i[c.NUMERICIDENTIFIER]})`), y("PRERELEASEIDENTIFIERLOOSE", `(?:${i[c.NONNUMERICIDENTIFIER]}|${i[c.NUMERICIDENTIFIERLOOSE]})`), y("PRERELEASE", `(?:-(${i[c.PRERELEASEIDENTIFIER]}(?:\\.${i[c.PRERELEASEIDENTIFIER]})*))`), y("PRERELEASELOOSE", `(?:-?(${i[c.PRERELEASEIDENTIFIERLOOSE]}(?:\\.${i[c.PRERELEASEIDENTIFIERLOOSE]})*))`), y("BUILDIDENTIFIER", `${_}+`), y("BUILD", `(?:\\+(${i[c.BUILDIDENTIFIER]}(?:\\.${i[c.BUILDIDENTIFIER]})*))`), y("FULLPLAIN", `v?${i[c.MAINVERSION]}${i[c.PRERELEASE]}?${i[c.BUILD]}?`), y("FULL", `^${i[c.FULLPLAIN]}$`), y("LOOSEPLAIN", `[v=\\s]*${i[c.MAINVERSIONLOOSE]}${i[c.PRERELEASELOOSE]}?${i[c.BUILD]}?`), y("LOOSE", `^${i[c.LOOSEPLAIN]}$`), y("GTLT", "((?:<|>)?=?)"), y("XRANGEIDENTIFIERLOOSE", `${i[c.NUMERICIDENTIFIERLOOSE]}|x|X|\\*`), y("XRANGEIDENTIFIER", `${i[c.NUMERICIDENTIFIER]}|x|X|\\*`), y("XRANGEPLAIN", `[v=\\s]*(${i[c.XRANGEIDENTIFIER]})(?:\\.(${i[c.XRANGEIDENTIFIER]})(?:\\.(${i[c.XRANGEIDENTIFIER]})(?:${i[c.PRERELEASE]})?${i[c.BUILD]}?)?)?`), y("XRANGEPLAINLOOSE", `[v=\\s]*(${i[c.XRANGEIDENTIFIERLOOSE]})(?:\\.(${i[c.XRANGEIDENTIFIERLOOSE]})(?:\\.(${i[c.XRANGEIDENTIFIERLOOSE]})(?:${i[c.PRERELEASELOOSE]})?${i[c.BUILD]}?)?)?`), y("XRANGE", `^${i[c.GTLT]}\\s*${i[c.XRANGEPLAIN]}$`), y("XRANGELOOSE", `^${i[c.GTLT]}\\s*${i[c.XRANGEPLAINLOOSE]}$`), y("COERCEPLAIN", `(^|[^\\d])(\\d{1,${r}})(?:\\.(\\d{1,${r}}))?(?:\\.(\\d{1,${r}}))?`), y("COERCE", `${i[c.COERCEPLAIN]}(?:$|[^\\d])`), y("COERCEFULL", i[c.COERCEPLAIN] + `(?:${i[c.PRERELEASE]})?(?:${i[c.BUILD]})?(?:$|[^\\d])`), y("COERCERTL", i[c.COERCE], !0), y("COERCERTLFULL", i[c.COERCEFULL], !0), y("LONETILDE", "(?:~>?)"), y("TILDETRIM", `(\\s*)${i[c.LONETILDE]}\\s+`, !0), t.tildeTrimReplace = "$1~", y("TILDE", `^${i[c.LONETILDE]}${i[c.XRANGEPLAIN]}$`), y("TILDELOOSE", `^${i[c.LONETILDE]}${i[c.XRANGEPLAINLOOSE]}$`), y("LONECARET", "(?:\\^)"), y("CARETTRIM", `(\\s*)${i[c.LONECARET]}\\s+`, !0), t.caretTrimReplace = "$1^", y("CARET", `^${i[c.LONECARET]}${i[c.XRANGEPLAIN]}$`), y("CARETLOOSE", `^${i[c.LONECARET]}${i[c.XRANGEPLAINLOOSE]}$`), y("COMPARATORLOOSE", `^${i[c.GTLT]}\\s*(${i[c.LOOSEPLAIN]})$|^$`), y("COMPARATOR", `^${i[c.GTLT]}\\s*(${i[c.FULLPLAIN]})$|^$`), y("COMPARATORTRIM", `(\\s*)${i[c.GTLT]}\\s*(${i[c.LOOSEPLAIN]}|${i[c.XRANGEPLAIN]})`, !0), t.comparatorTrimReplace = "$1$2$3", y("HYPHENRANGE", `^\\s*(${i[c.XRANGEPLAIN]})\\s+-\\s+(${i[c.XRANGEPLAIN]})\\s*$`), y("HYPHENRANGELOOSE", `^\\s*(${i[c.XRANGEPLAINLOOSE]})\\s+-\\s+(${i[c.XRANGEPLAINLOOSE]})\\s*$`), y("STAR", "(<|>)?=?\\s*\\*"), y("GTE0", "^\\s*>=\\s*0\\.0\\.0\\s*$"), y("GTE0PRE", "^\\s*>=\\s*0\\.0\\.0-0\\s*$");
})(Dn, Dn.exports);
var xt = Dn.exports;
const Ep = Object.freeze({ loose: !0 }), wp = Object.freeze({}), Sp = (e) => e ? typeof e != "object" ? Ep : e : wp;
var Vs = Sp;
const Aa = /^[0-9]+$/, ui = (e, t) => {
  if (typeof e == "number" && typeof t == "number")
    return e === t ? 0 : e < t ? -1 : 1;
  const r = Aa.test(e), n = Aa.test(t);
  return r && n && (e = +e, t = +t), e === t ? 0 : r && !n ? -1 : n && !r ? 1 : e < t ? -1 : 1;
}, bp = (e, t) => ui(t, e);
var di = {
  compareIdentifiers: ui,
  rcompareIdentifiers: bp
};
const nr = Fr, { MAX_LENGTH: ka, MAX_SAFE_INTEGER: sr } = zr, { safeRe: ar, t: or } = xt, Pp = Vs, { compareIdentifiers: pn } = di;
let Rp = class Ce {
  constructor(t, r) {
    if (r = Pp(r), t instanceof Ce) {
      if (t.loose === !!r.loose && t.includePrerelease === !!r.includePrerelease)
        return t;
      t = t.version;
    } else if (typeof t != "string")
      throw new TypeError(`Invalid version. Must be a string. Got type "${typeof t}".`);
    if (t.length > ka)
      throw new TypeError(
        `version is longer than ${ka} characters`
      );
    nr("SemVer", t, r), this.options = r, this.loose = !!r.loose, this.includePrerelease = !!r.includePrerelease;
    const n = t.trim().match(r.loose ? ar[or.LOOSE] : ar[or.FULL]);
    if (!n)
      throw new TypeError(`Invalid Version: ${t}`);
    if (this.raw = t, this.major = +n[1], this.minor = +n[2], this.patch = +n[3], this.major > sr || this.major < 0)
      throw new TypeError("Invalid major version");
    if (this.minor > sr || this.minor < 0)
      throw new TypeError("Invalid minor version");
    if (this.patch > sr || this.patch < 0)
      throw new TypeError("Invalid patch version");
    n[4] ? this.prerelease = n[4].split(".").map((s) => {
      if (/^[0-9]+$/.test(s)) {
        const a = +s;
        if (a >= 0 && a < sr)
          return a;
      }
      return s;
    }) : this.prerelease = [], this.build = n[5] ? n[5].split(".") : [], this.format();
  }
  format() {
    return this.version = `${this.major}.${this.minor}.${this.patch}`, this.prerelease.length && (this.version += `-${this.prerelease.join(".")}`), this.version;
  }
  toString() {
    return this.version;
  }
  compare(t) {
    if (nr("SemVer.compare", this.version, this.options, t), !(t instanceof Ce)) {
      if (typeof t == "string" && t === this.version)
        return 0;
      t = new Ce(t, this.options);
    }
    return t.version === this.version ? 0 : this.compareMain(t) || this.comparePre(t);
  }
  compareMain(t) {
    return t instanceof Ce || (t = new Ce(t, this.options)), this.major < t.major ? -1 : this.major > t.major ? 1 : this.minor < t.minor ? -1 : this.minor > t.minor ? 1 : this.patch < t.patch ? -1 : this.patch > t.patch ? 1 : 0;
  }
  comparePre(t) {
    if (t instanceof Ce || (t = new Ce(t, this.options)), this.prerelease.length && !t.prerelease.length)
      return -1;
    if (!this.prerelease.length && t.prerelease.length)
      return 1;
    if (!this.prerelease.length && !t.prerelease.length)
      return 0;
    let r = 0;
    do {
      const n = this.prerelease[r], s = t.prerelease[r];
      if (nr("prerelease compare", r, n, s), n === void 0 && s === void 0)
        return 0;
      if (s === void 0)
        return 1;
      if (n === void 0)
        return -1;
      if (n === s)
        continue;
      return pn(n, s);
    } while (++r);
  }
  compareBuild(t) {
    t instanceof Ce || (t = new Ce(t, this.options));
    let r = 0;
    do {
      const n = this.build[r], s = t.build[r];
      if (nr("build compare", r, n, s), n === void 0 && s === void 0)
        return 0;
      if (s === void 0)
        return 1;
      if (n === void 0)
        return -1;
      if (n === s)
        continue;
      return pn(n, s);
    } while (++r);
  }
  // preminor will bump the version up to the next minor release, and immediately
  // down to pre-release. premajor and prepatch work the same way.
  inc(t, r, n) {
    if (t.startsWith("pre")) {
      if (!r && n === !1)
        throw new Error("invalid increment argument: identifier is empty");
      if (r) {
        const s = `-${r}`.match(this.options.loose ? ar[or.PRERELEASELOOSE] : ar[or.PRERELEASE]);
        if (!s || s[1] !== r)
          throw new Error(`invalid identifier: ${r}`);
      }
    }
    switch (t) {
      case "premajor":
        this.prerelease.length = 0, this.patch = 0, this.minor = 0, this.major++, this.inc("pre", r, n);
        break;
      case "preminor":
        this.prerelease.length = 0, this.patch = 0, this.minor++, this.inc("pre", r, n);
        break;
      case "prepatch":
        this.prerelease.length = 0, this.inc("patch", r, n), this.inc("pre", r, n);
        break;
      case "prerelease":
        this.prerelease.length === 0 && this.inc("patch", r, n), this.inc("pre", r, n);
        break;
      case "release":
        if (this.prerelease.length === 0)
          throw new Error(`version ${this.raw} is not a prerelease`);
        this.prerelease.length = 0;
        break;
      case "major":
        (this.minor !== 0 || this.patch !== 0 || this.prerelease.length === 0) && this.major++, this.minor = 0, this.patch = 0, this.prerelease = [];
        break;
      case "minor":
        (this.patch !== 0 || this.prerelease.length === 0) && this.minor++, this.patch = 0, this.prerelease = [];
        break;
      case "patch":
        this.prerelease.length === 0 && this.patch++, this.prerelease = [];
        break;
      case "pre": {
        const s = Number(n) ? 1 : 0;
        if (this.prerelease.length === 0)
          this.prerelease = [s];
        else {
          let a = this.prerelease.length;
          for (; --a >= 0; )
            typeof this.prerelease[a] == "number" && (this.prerelease[a]++, a = -2);
          if (a === -1) {
            if (r === this.prerelease.join(".") && n === !1)
              throw new Error("invalid increment argument: identifier already exists");
            this.prerelease.push(s);
          }
        }
        if (r) {
          let a = [r, s];
          n === !1 && (a = [r]), pn(this.prerelease[0], r) === 0 ? isNaN(this.prerelease[1]) && (this.prerelease = a) : this.prerelease = a;
        }
        break;
      }
      default:
        throw new Error(`invalid increment argument: ${t}`);
    }
    return this.raw = this.format(), this.build.length && (this.raw += `+${this.build.join(".")}`), this;
  }
};
var pe = Rp;
const Ca = pe, Ip = (e, t, r = !1) => {
  if (e instanceof Ca)
    return e;
  try {
    return new Ca(e, t);
  } catch (n) {
    if (!r)
      return null;
    throw n;
  }
};
var kt = Ip;
const Np = kt, Op = (e, t) => {
  const r = Np(e, t);
  return r ? r.version : null;
};
var Tp = Op;
const jp = kt, Ap = (e, t) => {
  const r = jp(e.trim().replace(/^[=v]+/, ""), t);
  return r ? r.version : null;
};
var kp = Ap;
const Da = pe, Cp = (e, t, r, n, s) => {
  typeof r == "string" && (s = n, n = r, r = void 0);
  try {
    return new Da(
      e instanceof Da ? e.version : e,
      r
    ).inc(t, n, s).version;
  } catch {
    return null;
  }
};
var Dp = Cp;
const La = kt, Lp = (e, t) => {
  const r = La(e, null, !0), n = La(t, null, !0), s = r.compare(n);
  if (s === 0)
    return null;
  const a = s > 0, o = a ? r : n, l = a ? n : r, i = !!o.prerelease.length;
  if (!!l.prerelease.length && !i) {
    if (!l.patch && !l.minor)
      return "major";
    if (l.compareMain(o) === 0)
      return l.minor && !l.patch ? "minor" : "patch";
  }
  const c = i ? "pre" : "";
  return r.major !== n.major ? c + "major" : r.minor !== n.minor ? c + "minor" : r.patch !== n.patch ? c + "patch" : "prerelease";
};
var Mp = Lp;
const Vp = pe, zp = (e, t) => new Vp(e, t).major;
var Fp = zp;
const Up = pe, qp = (e, t) => new Up(e, t).minor;
var Gp = qp;
const Kp = pe, Hp = (e, t) => new Kp(e, t).patch;
var Xp = Hp;
const Wp = kt, Bp = (e, t) => {
  const r = Wp(e, t);
  return r && r.prerelease.length ? r.prerelease : null;
};
var xp = Bp;
const Ma = pe, Jp = (e, t, r) => new Ma(e, r).compare(new Ma(t, r));
var je = Jp;
const Yp = je, Zp = (e, t, r) => Yp(t, e, r);
var Qp = Zp;
const e$ = je, t$ = (e, t) => e$(e, t, !0);
var r$ = t$;
const Va = pe, n$ = (e, t, r) => {
  const n = new Va(e, r), s = new Va(t, r);
  return n.compare(s) || n.compareBuild(s);
};
var zs = n$;
const s$ = zs, a$ = (e, t) => e.sort((r, n) => s$(r, n, t));
var o$ = a$;
const i$ = zs, c$ = (e, t) => e.sort((r, n) => i$(n, r, t));
var l$ = c$;
const u$ = je, d$ = (e, t, r) => u$(e, t, r) > 0;
var Ur = d$;
const f$ = je, h$ = (e, t, r) => f$(e, t, r) < 0;
var Fs = h$;
const m$ = je, p$ = (e, t, r) => m$(e, t, r) === 0;
var fi = p$;
const $$ = je, y$ = (e, t, r) => $$(e, t, r) !== 0;
var hi = y$;
const g$ = je, v$ = (e, t, r) => g$(e, t, r) >= 0;
var Us = v$;
const _$ = je, E$ = (e, t, r) => _$(e, t, r) <= 0;
var qs = E$;
const w$ = fi, S$ = hi, b$ = Ur, P$ = Us, R$ = Fs, I$ = qs, N$ = (e, t, r, n) => {
  switch (t) {
    case "===":
      return typeof e == "object" && (e = e.version), typeof r == "object" && (r = r.version), e === r;
    case "!==":
      return typeof e == "object" && (e = e.version), typeof r == "object" && (r = r.version), e !== r;
    case "":
    case "=":
    case "==":
      return w$(e, r, n);
    case "!=":
      return S$(e, r, n);
    case ">":
      return b$(e, r, n);
    case ">=":
      return P$(e, r, n);
    case "<":
      return R$(e, r, n);
    case "<=":
      return I$(e, r, n);
    default:
      throw new TypeError(`Invalid operator: ${t}`);
  }
};
var mi = N$;
const O$ = pe, T$ = kt, { safeRe: ir, t: cr } = xt, j$ = (e, t) => {
  if (e instanceof O$)
    return e;
  if (typeof e == "number" && (e = String(e)), typeof e != "string")
    return null;
  t = t || {};
  let r = null;
  if (!t.rtl)
    r = e.match(t.includePrerelease ? ir[cr.COERCEFULL] : ir[cr.COERCE]);
  else {
    const i = t.includePrerelease ? ir[cr.COERCERTLFULL] : ir[cr.COERCERTL];
    let d;
    for (; (d = i.exec(e)) && (!r || r.index + r[0].length !== e.length); )
      (!r || d.index + d[0].length !== r.index + r[0].length) && (r = d), i.lastIndex = d.index + d[1].length + d[2].length;
    i.lastIndex = -1;
  }
  if (r === null)
    return null;
  const n = r[2], s = r[3] || "0", a = r[4] || "0", o = t.includePrerelease && r[5] ? `-${r[5]}` : "", l = t.includePrerelease && r[6] ? `+${r[6]}` : "";
  return T$(`${n}.${s}.${a}${o}${l}`, t);
};
var A$ = j$;
class k$ {
  constructor() {
    this.max = 1e3, this.map = /* @__PURE__ */ new Map();
  }
  get(t) {
    const r = this.map.get(t);
    if (r !== void 0)
      return this.map.delete(t), this.map.set(t, r), r;
  }
  delete(t) {
    return this.map.delete(t);
  }
  set(t, r) {
    if (!this.delete(t) && r !== void 0) {
      if (this.map.size >= this.max) {
        const s = this.map.keys().next().value;
        this.delete(s);
      }
      this.map.set(t, r);
    }
    return this;
  }
}
var C$ = k$, $n, za;
function Ae() {
  if (za) return $n;
  za = 1;
  const e = /\s+/g;
  class t {
    constructor(N, C) {
      if (C = s(C), N instanceof t)
        return N.loose === !!C.loose && N.includePrerelease === !!C.includePrerelease ? N : new t(N.raw, C);
      if (N instanceof a)
        return this.raw = N.value, this.set = [[N]], this.formatted = void 0, this;
      if (this.options = C, this.loose = !!C.loose, this.includePrerelease = !!C.includePrerelease, this.raw = N.trim().replace(e, " "), this.set = this.raw.split("||").map((A) => this.parseRange(A.trim())).filter((A) => A.length), !this.set.length)
        throw new TypeError(`Invalid SemVer Range: ${this.raw}`);
      if (this.set.length > 1) {
        const A = this.set[0];
        if (this.set = this.set.filter((V) => !y(V[0])), this.set.length === 0)
          this.set = [A];
        else if (this.set.length > 1) {
          for (const V of this.set)
            if (V.length === 1 && v(V[0])) {
              this.set = [V];
              break;
            }
        }
      }
      this.formatted = void 0;
    }
    get range() {
      if (this.formatted === void 0) {
        this.formatted = "";
        for (let N = 0; N < this.set.length; N++) {
          N > 0 && (this.formatted += "||");
          const C = this.set[N];
          for (let A = 0; A < C.length; A++)
            A > 0 && (this.formatted += " "), this.formatted += C[A].toString().trim();
        }
      }
      return this.formatted;
    }
    format() {
      return this.range;
    }
    toString() {
      return this.range;
    }
    parseRange(N) {
      const A = ((this.options.includePrerelease && $) | (this.options.loose && E)) + ":" + N, V = n.get(A);
      if (V)
        return V;
      const k = this.options.loose, P = k ? i[d.HYPHENRANGELOOSE] : i[d.HYPHENRANGE];
      N = N.replace(P, K(this.options.includePrerelease)), o("hyphen replace", N), N = N.replace(i[d.COMPARATORTRIM], c), o("comparator trim", N), N = N.replace(i[d.TILDETRIM], f), o("tilde trim", N), N = N.replace(i[d.CARETTRIM], _), o("caret trim", N);
      let p = N.split(" ").map((h) => w(h, this.options)).join(" ").split(/\s+/).map((h) => z(h, this.options));
      k && (p = p.filter((h) => (o("loose invalid filter", h, this.options), !!h.match(i[d.COMPARATORLOOSE])))), o("range list", p);
      const S = /* @__PURE__ */ new Map(), g = p.map((h) => new a(h, this.options));
      for (const h of g) {
        if (y(h))
          return [h];
        S.set(h.value, h);
      }
      S.size > 1 && S.has("") && S.delete("");
      const u = [...S.values()];
      return n.set(A, u), u;
    }
    intersects(N, C) {
      if (!(N instanceof t))
        throw new TypeError("a Range is required");
      return this.set.some((A) => m(A, C) && N.set.some((V) => m(V, C) && A.every((k) => V.every((P) => k.intersects(P, C)))));
    }
    // if ANY of the sets match ALL of its comparators, then pass
    test(N) {
      if (!N)
        return !1;
      if (typeof N == "string")
        try {
          N = new l(N, this.options);
        } catch {
          return !1;
        }
      for (let C = 0; C < this.set.length; C++)
        if (Z(this.set[C], N, this.options))
          return !0;
      return !1;
    }
  }
  $n = t;
  const r = C$, n = new r(), s = Vs, a = qr(), o = Fr, l = pe, {
    safeRe: i,
    t: d,
    comparatorTrimReplace: c,
    tildeTrimReplace: f,
    caretTrimReplace: _
  } = xt, { FLAG_INCLUDE_PRERELEASE: $, FLAG_LOOSE: E } = zr, y = (I) => I.value === "<0.0.0-0", v = (I) => I.value === "", m = (I, N) => {
    let C = !0;
    const A = I.slice();
    let V = A.pop();
    for (; C && A.length; )
      C = A.every((k) => V.intersects(k, N)), V = A.pop();
    return C;
  }, w = (I, N) => (I = I.replace(i[d.BUILD], ""), o("comp", I, N), I = x(I, N), o("caret", I), I = O(I, N), o("tildes", I), I = $e(I, N), o("xrange", I), I = Re(I, N), o("stars", I), I), R = (I) => !I || I.toLowerCase() === "x" || I === "*", O = (I, N) => I.trim().split(/\s+/).map((C) => j(C, N)).join(" "), j = (I, N) => {
    const C = N.loose ? i[d.TILDELOOSE] : i[d.TILDE];
    return I.replace(C, (A, V, k, P, p) => {
      o("tilde", I, A, V, k, P, p);
      let S;
      return R(V) ? S = "" : R(k) ? S = `>=${V}.0.0 <${+V + 1}.0.0-0` : R(P) ? S = `>=${V}.${k}.0 <${V}.${+k + 1}.0-0` : p ? (o("replaceTilde pr", p), S = `>=${V}.${k}.${P}-${p} <${V}.${+k + 1}.0-0`) : S = `>=${V}.${k}.${P} <${V}.${+k + 1}.0-0`, o("tilde return", S), S;
    });
  }, x = (I, N) => I.trim().split(/\s+/).map((C) => te(C, N)).join(" "), te = (I, N) => {
    o("caret", I, N);
    const C = N.loose ? i[d.CARETLOOSE] : i[d.CARET], A = N.includePrerelease ? "-0" : "";
    return I.replace(C, (V, k, P, p, S) => {
      o("caret", I, V, k, P, p, S);
      let g;
      return R(k) ? g = "" : R(P) ? g = `>=${k}.0.0${A} <${+k + 1}.0.0-0` : R(p) ? k === "0" ? g = `>=${k}.${P}.0${A} <${k}.${+P + 1}.0-0` : g = `>=${k}.${P}.0${A} <${+k + 1}.0.0-0` : S ? (o("replaceCaret pr", S), k === "0" ? P === "0" ? g = `>=${k}.${P}.${p}-${S} <${k}.${P}.${+p + 1}-0` : g = `>=${k}.${P}.${p}-${S} <${k}.${+P + 1}.0-0` : g = `>=${k}.${P}.${p}-${S} <${+k + 1}.0.0-0`) : (o("no pr"), k === "0" ? P === "0" ? g = `>=${k}.${P}.${p}${A} <${k}.${P}.${+p + 1}-0` : g = `>=${k}.${P}.${p}${A} <${k}.${+P + 1}.0-0` : g = `>=${k}.${P}.${p} <${+k + 1}.0.0-0`), o("caret return", g), g;
    });
  }, $e = (I, N) => (o("replaceXRanges", I, N), I.split(/\s+/).map((C) => we(C, N)).join(" ")), we = (I, N) => {
    I = I.trim();
    const C = N.loose ? i[d.XRANGELOOSE] : i[d.XRANGE];
    return I.replace(C, (A, V, k, P, p, S) => {
      o("xRange", I, A, V, k, P, p, S);
      const g = R(k), u = g || R(P), h = u || R(p), b = h;
      return V === "=" && b && (V = ""), S = N.includePrerelease ? "-0" : "", g ? V === ">" || V === "<" ? A = "<0.0.0-0" : A = "*" : V && b ? (u && (P = 0), p = 0, V === ">" ? (V = ">=", u ? (k = +k + 1, P = 0, p = 0) : (P = +P + 1, p = 0)) : V === "<=" && (V = "<", u ? k = +k + 1 : P = +P + 1), V === "<" && (S = "-0"), A = `${V + k}.${P}.${p}${S}`) : u ? A = `>=${k}.0.0${S} <${+k + 1}.0.0-0` : h && (A = `>=${k}.${P}.0${S} <${k}.${+P + 1}.0-0`), o("xRange return", A), A;
    });
  }, Re = (I, N) => (o("replaceStars", I, N), I.trim().replace(i[d.STAR], "")), z = (I, N) => (o("replaceGTE0", I, N), I.trim().replace(i[N.includePrerelease ? d.GTE0PRE : d.GTE0], "")), K = (I) => (N, C, A, V, k, P, p, S, g, u, h, b) => (R(A) ? C = "" : R(V) ? C = `>=${A}.0.0${I ? "-0" : ""}` : R(k) ? C = `>=${A}.${V}.0${I ? "-0" : ""}` : P ? C = `>=${C}` : C = `>=${C}${I ? "-0" : ""}`, R(g) ? S = "" : R(u) ? S = `<${+g + 1}.0.0-0` : R(h) ? S = `<${g}.${+u + 1}.0-0` : b ? S = `<=${g}.${u}.${h}-${b}` : I ? S = `<${g}.${u}.${+h + 1}-0` : S = `<=${S}`, `${C} ${S}`.trim()), Z = (I, N, C) => {
    for (let A = 0; A < I.length; A++)
      if (!I[A].test(N))
        return !1;
    if (N.prerelease.length && !C.includePrerelease) {
      for (let A = 0; A < I.length; A++)
        if (o(I[A].semver), I[A].semver !== a.ANY && I[A].semver.prerelease.length > 0) {
          const V = I[A].semver;
          if (V.major === N.major && V.minor === N.minor && V.patch === N.patch)
            return !0;
        }
      return !1;
    }
    return !0;
  };
  return $n;
}
var yn, Fa;
function qr() {
  if (Fa) return yn;
  Fa = 1;
  const e = Symbol("SemVer ANY");
  class t {
    static get ANY() {
      return e;
    }
    constructor(c, f) {
      if (f = r(f), c instanceof t) {
        if (c.loose === !!f.loose)
          return c;
        c = c.value;
      }
      c = c.trim().split(/\s+/).join(" "), o("comparator", c, f), this.options = f, this.loose = !!f.loose, this.parse(c), this.semver === e ? this.value = "" : this.value = this.operator + this.semver.version, o("comp", this);
    }
    parse(c) {
      const f = this.options.loose ? n[s.COMPARATORLOOSE] : n[s.COMPARATOR], _ = c.match(f);
      if (!_)
        throw new TypeError(`Invalid comparator: ${c}`);
      this.operator = _[1] !== void 0 ? _[1] : "", this.operator === "=" && (this.operator = ""), _[2] ? this.semver = new l(_[2], this.options.loose) : this.semver = e;
    }
    toString() {
      return this.value;
    }
    test(c) {
      if (o("Comparator.test", c, this.options.loose), this.semver === e || c === e)
        return !0;
      if (typeof c == "string")
        try {
          c = new l(c, this.options);
        } catch {
          return !1;
        }
      return a(c, this.operator, this.semver, this.options);
    }
    intersects(c, f) {
      if (!(c instanceof t))
        throw new TypeError("a Comparator is required");
      return this.operator === "" ? this.value === "" ? !0 : new i(c.value, f).test(this.value) : c.operator === "" ? c.value === "" ? !0 : new i(this.value, f).test(c.semver) : (f = r(f), f.includePrerelease && (this.value === "<0.0.0-0" || c.value === "<0.0.0-0") || !f.includePrerelease && (this.value.startsWith("<0.0.0") || c.value.startsWith("<0.0.0")) ? !1 : !!(this.operator.startsWith(">") && c.operator.startsWith(">") || this.operator.startsWith("<") && c.operator.startsWith("<") || this.semver.version === c.semver.version && this.operator.includes("=") && c.operator.includes("=") || a(this.semver, "<", c.semver, f) && this.operator.startsWith(">") && c.operator.startsWith("<") || a(this.semver, ">", c.semver, f) && this.operator.startsWith("<") && c.operator.startsWith(">")));
    }
  }
  yn = t;
  const r = Vs, { safeRe: n, t: s } = xt, a = mi, o = Fr, l = pe, i = Ae();
  return yn;
}
const D$ = Ae(), L$ = (e, t, r) => {
  try {
    t = new D$(t, r);
  } catch {
    return !1;
  }
  return t.test(e);
};
var Gr = L$;
const M$ = Ae(), V$ = (e, t) => new M$(e, t).set.map((r) => r.map((n) => n.value).join(" ").trim().split(" "));
var z$ = V$;
const F$ = pe, U$ = Ae(), q$ = (e, t, r) => {
  let n = null, s = null, a = null;
  try {
    a = new U$(t, r);
  } catch {
    return null;
  }
  return e.forEach((o) => {
    a.test(o) && (!n || s.compare(o) === -1) && (n = o, s = new F$(n, r));
  }), n;
};
var G$ = q$;
const K$ = pe, H$ = Ae(), X$ = (e, t, r) => {
  let n = null, s = null, a = null;
  try {
    a = new H$(t, r);
  } catch {
    return null;
  }
  return e.forEach((o) => {
    a.test(o) && (!n || s.compare(o) === 1) && (n = o, s = new K$(n, r));
  }), n;
};
var W$ = X$;
const gn = pe, B$ = Ae(), Ua = Ur, x$ = (e, t) => {
  e = new B$(e, t);
  let r = new gn("0.0.0");
  if (e.test(r) || (r = new gn("0.0.0-0"), e.test(r)))
    return r;
  r = null;
  for (let n = 0; n < e.set.length; ++n) {
    const s = e.set[n];
    let a = null;
    s.forEach((o) => {
      const l = new gn(o.semver.version);
      switch (o.operator) {
        case ">":
          l.prerelease.length === 0 ? l.patch++ : l.prerelease.push(0), l.raw = l.format();
        case "":
        case ">=":
          (!a || Ua(l, a)) && (a = l);
          break;
        case "<":
        case "<=":
          break;
        default:
          throw new Error(`Unexpected operation: ${o.operator}`);
      }
    }), a && (!r || Ua(r, a)) && (r = a);
  }
  return r && e.test(r) ? r : null;
};
var J$ = x$;
const Y$ = Ae(), Z$ = (e, t) => {
  try {
    return new Y$(e, t).range || "*";
  } catch {
    return null;
  }
};
var Q$ = Z$;
const ey = pe, pi = qr(), { ANY: ty } = pi, ry = Ae(), ny = Gr, qa = Ur, Ga = Fs, sy = qs, ay = Us, oy = (e, t, r, n) => {
  e = new ey(e, n), t = new ry(t, n);
  let s, a, o, l, i;
  switch (r) {
    case ">":
      s = qa, a = sy, o = Ga, l = ">", i = ">=";
      break;
    case "<":
      s = Ga, a = ay, o = qa, l = "<", i = "<=";
      break;
    default:
      throw new TypeError('Must provide a hilo val of "<" or ">"');
  }
  if (ny(e, t, n))
    return !1;
  for (let d = 0; d < t.set.length; ++d) {
    const c = t.set[d];
    let f = null, _ = null;
    if (c.forEach(($) => {
      $.semver === ty && ($ = new pi(">=0.0.0")), f = f || $, _ = _ || $, s($.semver, f.semver, n) ? f = $ : o($.semver, _.semver, n) && (_ = $);
    }), f.operator === l || f.operator === i || (!_.operator || _.operator === l) && a(e, _.semver))
      return !1;
    if (_.operator === i && o(e, _.semver))
      return !1;
  }
  return !0;
};
var Gs = oy;
const iy = Gs, cy = (e, t, r) => iy(e, t, ">", r);
var ly = cy;
const uy = Gs, dy = (e, t, r) => uy(e, t, "<", r);
var fy = dy;
const Ka = Ae(), hy = (e, t, r) => (e = new Ka(e, r), t = new Ka(t, r), e.intersects(t, r));
var my = hy;
const py = Gr, $y = je;
var yy = (e, t, r) => {
  const n = [];
  let s = null, a = null;
  const o = e.sort((c, f) => $y(c, f, r));
  for (const c of o)
    py(c, t, r) ? (a = c, s || (s = c)) : (a && n.push([s, a]), a = null, s = null);
  s && n.push([s, null]);
  const l = [];
  for (const [c, f] of n)
    c === f ? l.push(c) : !f && c === o[0] ? l.push("*") : f ? c === o[0] ? l.push(`<=${f}`) : l.push(`${c} - ${f}`) : l.push(`>=${c}`);
  const i = l.join(" || "), d = typeof t.raw == "string" ? t.raw : String(t);
  return i.length < d.length ? i : t;
};
const Ha = Ae(), Ks = qr(), { ANY: vn } = Ks, Vt = Gr, Hs = je, gy = (e, t, r = {}) => {
  if (e === t)
    return !0;
  e = new Ha(e, r), t = new Ha(t, r);
  let n = !1;
  e: for (const s of e.set) {
    for (const a of t.set) {
      const o = _y(s, a, r);
      if (n = n || o !== null, o)
        continue e;
    }
    if (n)
      return !1;
  }
  return !0;
}, vy = [new Ks(">=0.0.0-0")], Xa = [new Ks(">=0.0.0")], _y = (e, t, r) => {
  if (e === t)
    return !0;
  if (e.length === 1 && e[0].semver === vn) {
    if (t.length === 1 && t[0].semver === vn)
      return !0;
    r.includePrerelease ? e = vy : e = Xa;
  }
  if (t.length === 1 && t[0].semver === vn) {
    if (r.includePrerelease)
      return !0;
    t = Xa;
  }
  const n = /* @__PURE__ */ new Set();
  let s, a;
  for (const $ of e)
    $.operator === ">" || $.operator === ">=" ? s = Wa(s, $, r) : $.operator === "<" || $.operator === "<=" ? a = Ba(a, $, r) : n.add($.semver);
  if (n.size > 1)
    return null;
  let o;
  if (s && a) {
    if (o = Hs(s.semver, a.semver, r), o > 0)
      return null;
    if (o === 0 && (s.operator !== ">=" || a.operator !== "<="))
      return null;
  }
  for (const $ of n) {
    if (s && !Vt($, String(s), r) || a && !Vt($, String(a), r))
      return null;
    for (const E of t)
      if (!Vt($, String(E), r))
        return !1;
    return !0;
  }
  let l, i, d, c, f = a && !r.includePrerelease && a.semver.prerelease.length ? a.semver : !1, _ = s && !r.includePrerelease && s.semver.prerelease.length ? s.semver : !1;
  f && f.prerelease.length === 1 && a.operator === "<" && f.prerelease[0] === 0 && (f = !1);
  for (const $ of t) {
    if (c = c || $.operator === ">" || $.operator === ">=", d = d || $.operator === "<" || $.operator === "<=", s) {
      if (_ && $.semver.prerelease && $.semver.prerelease.length && $.semver.major === _.major && $.semver.minor === _.minor && $.semver.patch === _.patch && (_ = !1), $.operator === ">" || $.operator === ">=") {
        if (l = Wa(s, $, r), l === $ && l !== s)
          return !1;
      } else if (s.operator === ">=" && !Vt(s.semver, String($), r))
        return !1;
    }
    if (a) {
      if (f && $.semver.prerelease && $.semver.prerelease.length && $.semver.major === f.major && $.semver.minor === f.minor && $.semver.patch === f.patch && (f = !1), $.operator === "<" || $.operator === "<=") {
        if (i = Ba(a, $, r), i === $ && i !== a)
          return !1;
      } else if (a.operator === "<=" && !Vt(a.semver, String($), r))
        return !1;
    }
    if (!$.operator && (a || s) && o !== 0)
      return !1;
  }
  return !(s && d && !a && o !== 0 || a && c && !s && o !== 0 || _ || f);
}, Wa = (e, t, r) => {
  if (!e)
    return t;
  const n = Hs(e.semver, t.semver, r);
  return n > 0 ? e : n < 0 || t.operator === ">" && e.operator === ">=" ? t : e;
}, Ba = (e, t, r) => {
  if (!e)
    return t;
  const n = Hs(e.semver, t.semver, r);
  return n < 0 ? e : n > 0 || t.operator === "<" && e.operator === "<=" ? t : e;
};
var Ey = gy;
const _n = xt, xa = zr, wy = pe, Ja = di, Sy = kt, by = Tp, Py = kp, Ry = Dp, Iy = Mp, Ny = Fp, Oy = Gp, Ty = Xp, jy = xp, Ay = je, ky = Qp, Cy = r$, Dy = zs, Ly = o$, My = l$, Vy = Ur, zy = Fs, Fy = fi, Uy = hi, qy = Us, Gy = qs, Ky = mi, Hy = A$, Xy = qr(), Wy = Ae(), By = Gr, xy = z$, Jy = G$, Yy = W$, Zy = J$, Qy = Q$, e0 = Gs, t0 = ly, r0 = fy, n0 = my, s0 = yy, a0 = Ey;
var o0 = {
  parse: Sy,
  valid: by,
  clean: Py,
  inc: Ry,
  diff: Iy,
  major: Ny,
  minor: Oy,
  patch: Ty,
  prerelease: jy,
  compare: Ay,
  rcompare: ky,
  compareLoose: Cy,
  compareBuild: Dy,
  sort: Ly,
  rsort: My,
  gt: Vy,
  lt: zy,
  eq: Fy,
  neq: Uy,
  gte: qy,
  lte: Gy,
  cmp: Ky,
  coerce: Hy,
  Comparator: Xy,
  Range: Wy,
  satisfies: By,
  toComparators: xy,
  maxSatisfying: Jy,
  minSatisfying: Yy,
  minVersion: Zy,
  validRange: Qy,
  outside: e0,
  gtr: t0,
  ltr: r0,
  intersects: n0,
  simplifyRange: s0,
  subset: a0,
  SemVer: wy,
  re: _n.re,
  src: _n.src,
  tokens: _n.t,
  SEMVER_SPEC_VERSION: xa.SEMVER_SPEC_VERSION,
  RELEASE_TYPES: xa.RELEASE_TYPES,
  compareIdentifiers: Ja.compareIdentifiers,
  rcompareIdentifiers: Ja.rcompareIdentifiers
};
const Et = /* @__PURE__ */ io(o0), i0 = Object.prototype.toString, c0 = "[object Uint8Array]", l0 = "[object ArrayBuffer]";
function $i(e, t, r) {
  return e ? e.constructor === t ? !0 : i0.call(e) === r : !1;
}
function yi(e) {
  return $i(e, Uint8Array, c0);
}
function u0(e) {
  return $i(e, ArrayBuffer, l0);
}
function d0(e) {
  return yi(e) || u0(e);
}
function f0(e) {
  if (!yi(e))
    throw new TypeError(`Expected \`Uint8Array\`, got \`${typeof e}\``);
}
function h0(e) {
  if (!d0(e))
    throw new TypeError(`Expected \`Uint8Array\` or \`ArrayBuffer\`, got \`${typeof e}\``);
}
function En(e, t) {
  if (e.length === 0)
    return new Uint8Array(0);
  t ?? (t = e.reduce((s, a) => s + a.length, 0));
  const r = new Uint8Array(t);
  let n = 0;
  for (const s of e)
    f0(s), r.set(s, n), n += s.length;
  return r;
}
const lr = {
  utf8: new globalThis.TextDecoder("utf8")
};
function ur(e, t = "utf8") {
  return h0(e), lr[t] ?? (lr[t] = new globalThis.TextDecoder(t)), lr[t].decode(e);
}
function m0(e) {
  if (typeof e != "string")
    throw new TypeError(`Expected \`string\`, got \`${typeof e}\``);
}
const p0 = new globalThis.TextEncoder();
function dr(e) {
  return m0(e), p0.encode(e);
}
Array.from({ length: 256 }, (e, t) => t.toString(16).padStart(2, "0"));
const wn = "aes-256-cbc", Je = () => /* @__PURE__ */ Object.create(null), Ya = (e) => e !== void 0, Sn = (e, t) => {
  const r = /* @__PURE__ */ new Set([
    "undefined",
    "symbol",
    "function"
  ]), n = typeof t;
  if (r.has(n))
    throw new TypeError(`Setting a value of type \`${n}\` for key \`${e}\` is not allowed as it's not supported by JSON`);
}, Ze = "__internal__", bn = `${Ze}.migrations.version`;
var tt, Oe, ye, Se, ut, dt, Rt, De, oe, gi, vi, _i, Ei, wi, Si, bi, Pi;
class $0 {
  constructor(t = {}) {
    ke(this, oe);
    Dt(this, "path");
    Dt(this, "events");
    ke(this, tt);
    ke(this, Oe);
    ke(this, ye);
    ke(this, Se, {});
    ke(this, ut, !1);
    ke(this, dt);
    ke(this, Rt);
    ke(this, De);
    Dt(this, "_deserialize", (t) => JSON.parse(t));
    Dt(this, "_serialize", (t) => JSON.stringify(t, void 0, "	"));
    const r = ze(this, oe, gi).call(this, t);
    ve(this, ye, r), ze(this, oe, vi).call(this, r), ze(this, oe, Ei).call(this, r), ze(this, oe, wi).call(this, r), this.events = new EventTarget(), ve(this, Oe, r.encryptionKey), this.path = ze(this, oe, Si).call(this, r), ze(this, oe, bi).call(this, r), r.watch && this._watch();
  }
  get(t, r) {
    if (q(this, ye).accessPropertiesByDotNotation)
      return this._get(t, r);
    const { store: n } = this;
    return t in n ? n[t] : r;
  }
  set(t, r) {
    if (typeof t != "string" && typeof t != "object")
      throw new TypeError(`Expected \`key\` to be of type \`string\` or \`object\`, got ${typeof t}`);
    if (typeof t != "object" && r === void 0)
      throw new TypeError("Use `delete()` to clear values");
    if (this._containsReservedKey(t))
      throw new TypeError(`Please don't use the ${Ze} key, as it's used to manage this module internal operations.`);
    const { store: n } = this, s = (a, o) => {
      if (Sn(a, o), q(this, ye).accessPropertiesByDotNotation)
        Jt(n, a, o);
      else {
        if (a === "__proto__" || a === "constructor" || a === "prototype")
          return;
        n[a] = o;
      }
    };
    if (typeof t == "object") {
      const a = t;
      for (const [o, l] of Object.entries(a))
        s(o, l);
    } else
      s(t, r);
    this.store = n;
  }
  has(t) {
    return q(this, ye).accessPropertiesByDotNotation ? on(this.store, t) : t in this.store;
  }
  appendToArray(t, r) {
    Sn(t, r);
    const n = q(this, ye).accessPropertiesByDotNotation ? this._get(t, []) : t in this.store ? this.store[t] : [];
    if (!Array.isArray(n))
      throw new TypeError(`The key \`${t}\` is already set to a non-array value`);
    this.set(t, [...n, r]);
  }
  /**
      Reset items to their default values, as defined by the `defaults` or `schema` option.
  
      @see `clear()` to reset all items.
  
      @param keys - The keys of the items to reset.
      */
  reset(...t) {
    for (const r of t)
      Ya(q(this, Se)[r]) && this.set(r, q(this, Se)[r]);
  }
  delete(t) {
    const { store: r } = this;
    q(this, ye).accessPropertiesByDotNotation ? Li(r, t) : delete r[t], this.store = r;
  }
  /**
      Delete all items.
  
      This resets known items to their default values, if defined by the `defaults` or `schema` option.
      */
  clear() {
    const t = Je();
    for (const r of Object.keys(q(this, Se)))
      Ya(q(this, Se)[r]) && (Sn(r, q(this, Se)[r]), q(this, ye).accessPropertiesByDotNotation ? Jt(t, r, q(this, Se)[r]) : t[r] = q(this, Se)[r]);
    this.store = t;
  }
  onDidChange(t, r) {
    if (typeof t != "string")
      throw new TypeError(`Expected \`key\` to be of type \`string\`, got ${typeof t}`);
    if (typeof r != "function")
      throw new TypeError(`Expected \`callback\` to be of type \`function\`, got ${typeof r}`);
    return this._handleValueChange(() => this.get(t), r);
  }
  /**
      Watches the whole config object, calling `callback` on any changes.
  
      @param callback - A callback function that is called on any changes. When a `key` is first set `oldValue` will be `undefined`, and when a key is deleted `newValue` will be `undefined`.
      @returns A function, that when called, will unsubscribe.
      */
  onDidAnyChange(t) {
    if (typeof t != "function")
      throw new TypeError(`Expected \`callback\` to be of type \`function\`, got ${typeof t}`);
    return this._handleStoreChange(t);
  }
  get size() {
    return Object.keys(this.store).filter((r) => !this._isReservedKeyPath(r)).length;
  }
  /**
      Get all the config as an object or replace the current config with an object.
  
      @example
      ```
      console.log(config.store);
      //=> {name: 'John', age: 30}
      ```
  
      @example
      ```
      config.store = {
          hello: 'world'
      };
      ```
      */
  get store() {
    var t;
    try {
      const r = G.readFileSync(this.path, q(this, Oe) ? null : "utf8"), n = this._decryptData(r), s = this._deserialize(n);
      return q(this, ut) || this._validate(s), Object.assign(Je(), s);
    } catch (r) {
      if ((r == null ? void 0 : r.code) === "ENOENT")
        return this._ensureDirectory(), Je();
      if (q(this, ye).clearInvalidConfig) {
        const n = r;
        if (n.name === "SyntaxError" || (t = n.message) != null && t.startsWith("Config schema violation:"))
          return Je();
      }
      throw r;
    }
  }
  set store(t) {
    if (this._ensureDirectory(), !on(t, Ze))
      try {
        const r = G.readFileSync(this.path, q(this, Oe) ? null : "utf8"), n = this._decryptData(r), s = this._deserialize(n);
        on(s, Ze) && Jt(t, Ze, Ys(s, Ze));
      } catch {
      }
    q(this, ut) || this._validate(t), this._write(t), this.events.dispatchEvent(new Event("change"));
  }
  *[Symbol.iterator]() {
    for (const [t, r] of Object.entries(this.store))
      this._isReservedKeyPath(t) || (yield [t, r]);
  }
  /**
  Close the file watcher if one exists. This is useful in tests to prevent the process from hanging.
  */
  _closeWatcher() {
    q(this, dt) && (q(this, dt).close(), ve(this, dt, void 0)), q(this, Rt) && (G.unwatchFile(this.path), ve(this, Rt, !1)), ve(this, De, void 0);
  }
  _decryptData(t) {
    if (!q(this, Oe))
      return typeof t == "string" ? t : ur(t);
    try {
      const r = t.slice(0, 16), n = st.pbkdf2Sync(q(this, Oe), r, 1e4, 32, "sha512"), s = st.createDecipheriv(wn, n, r), a = t.slice(17), o = typeof a == "string" ? dr(a) : a;
      return ur(En([s.update(o), s.final()]));
    } catch {
      try {
        const r = t.slice(0, 16), n = st.pbkdf2Sync(q(this, Oe), r.toString(), 1e4, 32, "sha512"), s = st.createDecipheriv(wn, n, r), a = t.slice(17), o = typeof a == "string" ? dr(a) : a;
        return ur(En([s.update(o), s.final()]));
      } catch {
      }
    }
    return typeof t == "string" ? t : ur(t);
  }
  _handleStoreChange(t) {
    let r = this.store;
    const n = () => {
      const s = r, a = this.store;
      xs(a, s) || (r = a, t.call(this, a, s));
    };
    return this.events.addEventListener("change", n), () => {
      this.events.removeEventListener("change", n);
    };
  }
  _handleValueChange(t, r) {
    let n = t();
    const s = () => {
      const a = n, o = t();
      xs(o, a) || (n = o, r.call(this, o, a));
    };
    return this.events.addEventListener("change", s), () => {
      this.events.removeEventListener("change", s);
    };
  }
  _validate(t) {
    if (!q(this, tt) || q(this, tt).call(this, t) || !q(this, tt).errors)
      return;
    const n = q(this, tt).errors.map(({ instancePath: s, message: a = "" }) => `\`${s.slice(1)}\` ${a}`);
    throw new Error("Config schema violation: " + n.join("; "));
  }
  _ensureDirectory() {
    G.mkdirSync(X.dirname(this.path), { recursive: !0 });
  }
  _write(t) {
    let r = this._serialize(t);
    if (q(this, Oe)) {
      const n = st.randomBytes(16), s = st.pbkdf2Sync(q(this, Oe), n, 1e4, 32, "sha512"), a = st.createCipheriv(wn, s, n);
      r = En([n, dr(":"), a.update(dr(r)), a.final()]);
    }
    if (ne.env.SNAP)
      G.writeFileSync(this.path, r, { mode: q(this, ye).configFileMode });
    else
      try {
        oo(this.path, r, { mode: q(this, ye).configFileMode });
      } catch (n) {
        if ((n == null ? void 0 : n.code) === "EXDEV") {
          G.writeFileSync(this.path, r, { mode: q(this, ye).configFileMode });
          return;
        }
        throw n;
      }
  }
  _watch() {
    if (this._ensureDirectory(), G.existsSync(this.path) || this._write(Je()), ne.platform === "win32" || ne.platform === "darwin") {
      q(this, De) ?? ve(this, De, ja(() => {
        this.events.dispatchEvent(new Event("change"));
      }, { wait: 100 }));
      const t = X.dirname(this.path), r = X.basename(this.path);
      ve(this, dt, G.watch(t, { persistent: !1, encoding: "utf8" }, (n, s) => {
        s && s !== r || typeof q(this, De) == "function" && q(this, De).call(this);
      }));
    } else
      q(this, De) ?? ve(this, De, ja(() => {
        this.events.dispatchEvent(new Event("change"));
      }, { wait: 1e3 })), G.watchFile(this.path, { persistent: !1 }, (t, r) => {
        typeof q(this, De) == "function" && q(this, De).call(this);
      }), ve(this, Rt, !0);
  }
  _migrate(t, r, n) {
    let s = this._get(bn, "0.0.0");
    const a = Object.keys(t).filter((l) => this._shouldPerformMigration(l, s, r));
    let o = structuredClone(this.store);
    for (const l of a)
      try {
        n && n(this, {
          fromVersion: s,
          toVersion: l,
          finalVersion: r,
          versions: a
        });
        const i = t[l];
        i == null || i(this), this._set(bn, l), s = l, o = structuredClone(this.store);
      } catch (i) {
        this.store = o;
        try {
          this._write(o);
        } catch {
        }
        const d = i instanceof Error ? i.message : String(i);
        throw new Error(`Something went wrong during the migration! Changes applied to the store until this failed migration will be restored. ${d}`);
      }
    (this._isVersionInRangeFormat(s) || !Et.eq(s, r)) && this._set(bn, r);
  }
  _containsReservedKey(t) {
    return typeof t == "string" ? this._isReservedKeyPath(t) : !t || typeof t != "object" ? !1 : this._objectContainsReservedKey(t);
  }
  _objectContainsReservedKey(t) {
    if (!t || typeof t != "object")
      return !1;
    for (const [r, n] of Object.entries(t))
      if (this._isReservedKeyPath(r) || this._objectContainsReservedKey(n))
        return !0;
    return !1;
  }
  _isReservedKeyPath(t) {
    return t === Ze || t.startsWith(`${Ze}.`);
  }
  _isVersionInRangeFormat(t) {
    return Et.clean(t) === null;
  }
  _shouldPerformMigration(t, r, n) {
    return this._isVersionInRangeFormat(t) ? r !== "0.0.0" && Et.satisfies(r, t) ? !1 : Et.satisfies(n, t) : !(Et.lte(t, r) || Et.gt(t, n));
  }
  _get(t, r) {
    return Ys(this.store, t, r);
  }
  _set(t, r) {
    const { store: n } = this;
    Jt(n, t, r), this.store = n;
  }
}
tt = new WeakMap(), Oe = new WeakMap(), ye = new WeakMap(), Se = new WeakMap(), ut = new WeakMap(), dt = new WeakMap(), Rt = new WeakMap(), De = new WeakMap(), oe = new WeakSet(), gi = function(t) {
  const r = {
    configName: "config",
    fileExtension: "json",
    projectSuffix: "nodejs",
    clearInvalidConfig: !1,
    accessPropertiesByDotNotation: !0,
    configFileMode: 438,
    ...t
  };
  if (!r.cwd) {
    if (!r.projectName)
      throw new Error("Please specify the `projectName` option.");
    r.cwd = Fi(r.projectName, { suffix: r.projectSuffix }).config;
  }
  return typeof r.fileExtension == "string" && (r.fileExtension = r.fileExtension.replace(/^\.+/, "")), r;
}, vi = function(t) {
  if (!(t.schema ?? t.ajvOptions ?? t.rootSchema))
    return;
  if (t.schema && typeof t.schema != "object")
    throw new TypeError("The `schema` option must be an object.");
  const r = op.default, n = new Hm.Ajv2020({
    allErrors: !0,
    useDefaults: !0,
    ...t.ajvOptions
  });
  r(n);
  const s = {
    ...t.rootSchema,
    type: "object",
    properties: t.schema
  };
  ve(this, tt, n.compile(s)), ze(this, oe, _i).call(this, t.schema);
}, _i = function(t) {
  const r = Object.entries(t ?? {});
  for (const [n, s] of r) {
    if (!s || typeof s != "object" || !Object.hasOwn(s, "default"))
      continue;
    const { default: a } = s;
    a !== void 0 && (q(this, Se)[n] = a);
  }
}, Ei = function(t) {
  t.defaults && Object.assign(q(this, Se), t.defaults);
}, wi = function(t) {
  t.serialize && (this._serialize = t.serialize), t.deserialize && (this._deserialize = t.deserialize);
}, Si = function(t) {
  const r = typeof t.fileExtension == "string" ? t.fileExtension : void 0, n = r ? `.${r}` : "";
  return X.resolve(t.cwd, `${t.configName ?? "config"}${n}`);
}, bi = function(t) {
  if (t.migrations) {
    ze(this, oe, Pi).call(this, t), this._validate(this.store);
    return;
  }
  const r = this.store, n = Object.assign(Je(), t.defaults ?? {}, r);
  this._validate(n);
  try {
    Js.deepEqual(r, n);
  } catch {
    this.store = n;
  }
}, Pi = function(t) {
  const { migrations: r, projectVersion: n } = t;
  if (r) {
    if (!n)
      throw new Error("Please specify the `projectVersion` option.");
    ve(this, ut, !0);
    try {
      const s = this.store, a = Object.assign(Je(), t.defaults ?? {}, s);
      try {
        Js.deepEqual(s, a);
      } catch {
        this._write(a);
      }
      this._migrate(r, n, t.beforeEachMigration);
    } finally {
      ve(this, ut, !1);
    }
  }
};
const { app: yr, ipcMain: Ln, shell: y0 } = eo;
let Za = !1;
const Qa = () => {
  if (!Ln || !yr)
    throw new Error("Electron Store: You need to call `.initRenderer()` from the main process.");
  const e = {
    defaultCwd: yr.getPath("userData"),
    appVersion: yr.getVersion()
  };
  return Za || (Ln.on("electron-store-get-data", (t) => {
    t.returnValue = e;
  }), Za = !0), e;
};
class g0 extends $0 {
  constructor(t) {
    let r, n;
    if (ne.type === "renderer") {
      const s = eo.ipcRenderer.sendSync("electron-store-get-data");
      if (!s)
        throw new Error("Electron Store: You need to call `.initRenderer()` from the main process.");
      ({ defaultCwd: r, appVersion: n } = s);
    } else Ln && yr && ({ defaultCwd: r, appVersion: n } = Qa());
    t = {
      name: "config",
      ...t
    }, t.projectVersion || (t.projectVersion = n), t.cwd ? t.cwd = X.isAbsolute(t.cwd) ? t.cwd : X.join(r, t.cwd) : t.cwd = r, t.configName = t.name, delete t.name, super(t);
  }
  static initRenderer() {
    Qa();
  }
  async openInEditor() {
    const t = await y0.openPath(this.path);
    if (t)
      throw new Error(t);
  }
}
const v0 = Ai(import.meta.url);
console.log(v0);
const Ri = X.dirname(ki(import.meta.url)), yt = new g0();
process.env.APP_ROOT = X.join(Ri, "..");
const Mn = process.env.VITE_DEV_SERVER_URL, j0 = X.join(process.env.APP_ROOT, "dist-electron"), Ii = X.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = Mn ? X.join(process.env.APP_ROOT, "public") : Ii;
let Qe;
pt.handle("store-get", (e, t, r) => yt.get(t, r));
pt.handle("store-set", (e, t, r) => {
  yt.set(t, r);
});
pt.handle("store-delete", (e, t) => {
  yt.delete(t);
});
pt.handle("store-clear", () => {
  yt.clear();
});
pt.handle("store-has", (e, t) => yt.has(t));
pt.handle("store-reset", (e, t, r) => yt.reset(t, r));
pt.handle("store-get-all", () => yt.store);
function Ni() {
  Qe = new to({
    icon: X.join(process.env.VITE_PUBLIC, "btc.ico"),
    autoHideMenuBar: !0,
    webPreferences: {
      preload: X.join(Ri, "preload.mjs")
    }
  }), Qe.webContents.on("did-finish-load", () => {
    Qe == null || Qe.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), Mn ? Qe.loadURL(Mn) : Qe.loadFile(X.join(Ii, "index.html"));
}
gr.on("window-all-closed", () => {
  process.platform !== "darwin" && (gr.quit(), Qe = null);
});
gr.on("activate", () => {
  to.getAllWindows().length === 0 && Ni();
});
gr.whenReady().then(Ni);
export {
  j0 as MAIN_DIST,
  Ii as RENDERER_DIST,
  Mn as VITE_DEV_SERVER_URL
};
