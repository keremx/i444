// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"../../node_modules/login-app/src/utils.mjs":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

class AppErrors {
  constructor() {
    this.errors = [];
  }

  add(err) {
    let {
      message,
      options = {}
    } = err;
    if (!message) message = err.toString();
    this.errors.push({
      message,
      options
    });
    return this;
  }

  toString() {
    return this.errors.map(e => e.message).join('\n');
  }

}

var _default = {
  AppErrors
};
exports.default = _default;
},{}],"../../node_modules/login-app/src/login-ws.mjs":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _utils = _interopRequireDefault(require("./utils.mjs"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const {
  AppErrors
} = _utils.default;

class LoginWs {
  constructor(baseUrl) {
    this.baseUrl = `${baseUrl}/sessions`;
  }

  async login(params) {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });
      return await responseResult(response);
    } catch (err) {
      return new AppErrors().add(err);
    }
  }

  async renewSession(sessionId) {
    try {
      const response = await fetch(`${this.baseUrl}/${sessionId}`, {
        method: 'PATCH'
      });
      return await responseResult(response);
    } catch (err) {
      return new AppErrors().add(err);
    }
  }

  async logout(sessionId) {
    try {
      const response = await fetch(`${this.baseUrl}/${sessionId}`, {
        method: 'DELETE'
      });
      return await responseResult(response);
    } catch (err) {
      return new AppErrors().add(err);
    }
  }

}

exports.default = LoginWs;

async function responseResult(response) {
  const ret = await response.json();

  if (response.ok) {
    return ret;
  } else {
    return ret.errors ? ret : new AppErrors().add(response.statusText);
  }
}
},{"./utils.mjs":"../../node_modules/login-app/src/utils.mjs"}],"../../node_modules/login-app/src/login-app.mjs":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _loginWs = _interopRequireDefault(require("./login-ws.mjs"));

var _utils = _interopRequireDefault(require("./utils.mjs"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const {
  AppErrors
} = _utils.default;
/** A container for any App.  Ensures that App is displayed only
 *  when user is logged in; otherwise displays a login form.
 */

class LoginApp extends HTMLElement {
  constructor() {
    super(); //grab hold of attributes

    this.wsUrl = this.getAttribute('ws-url');
    this.sessionIdKey = this.getAttribute('session-id-key') ?? 'sessionId';
    this.autoLogoutSeconds = Number(this.getAttribute('autoLogoutSeconds') ?? 30);
    this.loginWs = new _loginWs.default(this.wsUrl); //normally, DOM handler called with self set to widget causing event;
    //ensure, self set to this instance always

    this.login = this.login.bind(this); //create listener for user activities.

    this.activity = this.activity.bind(this);
    ACTIVITY_EVENTS.forEach(e => document.addEventListener(e, this.activity, true)); //set up this.shadowRoot

    this.attachShadow({
      mode: 'open'
    }); //document part of this's state

    this.sessionInfo = undefined; //timestamp at which login was last checked on server

    this.lastCheckTime = -1; //timestamp at which user activity was last detected on this page

    this.lastActivityTime = -1;
  } //called when component added to DOM


  async connectedCallback() {
    await this.checkLogin();
  } //called when component removed from DOM; used to clean up


  disconnectedCallback() {
    if (this.logoutTimer) clearTimeout(this.logoutTimer);
    delete this.logoutTimer;
  } //handler called when any user activity detected in page


  activity(ev) {
    this.lastActivityTime = Date.now();
  } //event handler called when user logs in


  async login(ev) {
    ev.preventDefault(); //ev.target is submitted form; FormData returns data from loging form

    const formData = new FormData(ev.target);
    const loginResult = await this.loginWs.login(Object.fromEntries(formData));

    if (loginResult.errors) {
      reportErrors(this.shadowRoot, loginResult.errors);
    } else {
      const {
        sessionId
      } = loginResult; //remember sessionId in browser's sessionStorage

      sessionStorage.setItem(this.sessionIdKey, sessionId);
      this.sessionInfo = loginResult;
      this.checkLogin();
    }
  }
  /** check if session from sessionStorage is valid.  If it is,
   *  then renew it.  Display login container.
   */


  async checkLogin() {
    const sessionId = sessionStorage.getItem(this.sessionIdKey);
    let isLoggedIn = false;

    if (sessionId) {
      const renewResult = await this.loginWs.renewSession(sessionId);

      if (renewResult.errors) {
        sessionStorage.removeItem(this.sessionIdKey);
        delete this.sessionInfo;
      } else {
        isLoggedIn = true;
        this.sessionInfo = renewResult;
        this.lastCheckTime = Date.now();
        this.resetLogoutTimer();
      }
    }

    this.display(isLoggedIn);
  }
  /** depending on isLoggedIn, display either login form or contained app */


  display(isLoggedIn) {
    if (isLoggedIn) {
      if (!this.didAppLogin) {
        this.shadowRoot.innerHTML = APP_HTML + LOGOUT_WARNING_HTML;
        const app = this.getApp();
        if (app) dispatchLoginEventToApp(app, this.sessionInfo);
        this.didAppLogin = true;
      }
    } else {
      this.shadowRoot.innerHTML = LOGIN_FORM_HTML;
      this.shadowRoot.getElementById('loginForm').addEventListener('submit', this.login);
    }
  }

  async logout(sessionId) {
    if (this.logoutTimer) clearTimeout(this.logoutTimer);
    await this.loginWs.logout(sessionId);
    delete this.sessionInfo;
    sessionStorage.removeItem(this.sessionIdKey);
    delete this.didAppLogin;
    const app = this.getApp();
    if (app) dispatchLogoutEventToApp(app);
    await this.checkLogin();
  }

  getApp() {
    const appSlot = this.shadowRoot.getElementById('app');
    return appSlot.assignedNodes()[0];
  }
  /** Reset timer which controls logout warning dialog. */


  async resetLogoutTimer() {
    if (this.logoutTimer) clearTimeout(this.logoutTimer);
    const timeLeft = this.sessionInfo.maxAgeSeconds;
    const autoLogout = this.autoLogoutSeconds;
    const timeout = timeLeft < autoLogout ? timeLeft / 2 : timeLeft - autoLogout;
    const dialogSeconds = timeLeft - timeout;

    const timeFn = async () => {
      if (this.lastActivityTime > this.lastCheckTime) {
        await this.checkLogin(); //renew server login and this timer

        return;
      }

      const dialogRet = await logoutWarn(this.shadowRoot, dialogSeconds);
      const doLogout = dialogRet === 'logout';

      if (doLogout) {
        const sessionId = this.sessionInfo?.sessionId;
        if (sessionId) await this.logout(sessionId);
      } else {
        this.checkLogin();
      }
    };

    this.logoutTimer = setTimeout(timeFn, timeout * 1000);
  }

} //class LoginApp

/** Dispatch login custom event to app component.  sessionInfo
 *  sent as event details.
 */


exports.default = LoginApp;

function dispatchLoginEventToApp(app, sessionInfo) {
  const event = new CustomEvent('login', {
    detail: sessionInfo,
    bubbles: false
  });
  app.dispatchEvent(event);
}

function dispatchLogoutEventToApp(app) {
  const event = new CustomEvent('logout', {
    bubbles: false
  });
  app.dispatchEvent(event);
}
/** Display a modal dialog with a counting down logout message along
 *  with two buttons for continuing session or logging out.  If the
 *  logout button is pressed or no button is pressed within
 *  timeoutSeconds, then return a Promise<'logout'>; otherwise
 *  return a Promise<'logoutCancel'>.
 */


async function logoutWarn(doc, timeoutSeconds) {
  const dialogMessageWidget = doc.getElementById('logoutMsg');
  const dialogMessage = dialogMessageWidget.innerHTML;

  const countdownFn = () => {
    timeoutSeconds--;
    dialogMessageWidget.innerHTML = dialogMessage.replace('${seconds}', String(timeoutSeconds));
  };

  countdownFn();
  const logoutDialog = doc.getElementById('logoutDialog');

  if (typeof logoutDialog.showModal === 'function') {
    logoutDialog.showModal();
  } else {
    //not supported in firefox or safari
    const msg = 'The <dialog> API is not supported by this browser';
    return new AppErrors().add(msg);
  }

  const countdown = setInterval(countdownFn, 1000);
  return new Promise(resolve => {
    const logoutTimer = setTimeout(() => {
      clearInterval(countdown);
      logoutDialog.close();
      resolve('logout');
    }, timeoutSeconds * 1000);
    logoutDialog.addEventListener('close', ev => {
      clearInterval(countdown);
      clearTimeout(logoutTimer);
      resolve(logoutDialog.returnValue);
    });
  });
}
/** For each err in errors, if there is a widget with id equal to err.widget,
 *  then display err.message in that widget; otherwise display err.message
 *  as a generic error in list .errors.
 */


function reportErrors(doc, errors) {
  //clear all errors
  doc.querySelectorAll('.error').forEach(e => e.innerHTML = '');
  const genericMsgs = [];

  for (const err of errors) {
    const widgetId = err.options?.widget;
    const errWidget = widgetId && doc.getElementById(`err-${widgetId}`);
    const msg = err.message;

    if (errWidget) {
      errWidget.innerHTML = msg;
    } else {
      genericMsgs.push(msg);
    }
  }

  doc.getElementById('errors').innerHTML = genericMsgs.map(m => `<li>${m}</li>`).join('');
}

const ACTIVITY_EVENTS = ['keydown', 'mousedown', 'mousemove', 'scroll'];
const STYLE = `
  :host {
    display: block;
  }
  :host([hidden]) {
    display: none;
  }

  .grid-form {
    padding-top: 3em;
    display: grid;
    grid-template-columns: 0.5fr 1fr;
    grid-gap: 2vw;
  }
  
  .grid-form input {
    width: 50%;
  }
  
  .grid-form .submit {
    width: 25%;
    color: var(--color09);
  }
  
  label {
    font-weight: bold;
    text-align: right;
  }
  
  
  .error {
    color: red;
  }
`; //note slots which allow user to customize widget

const LOGIN_FORM_HTML = `
  <style>${STYLE}</style>
  <ul class="error" id="errors"></ul>
  <form id="loginForm" class="grid-form">
    <label for="loginId"><slot name="loginIdLabel">Login ID:</slot></label>
    <span>
      <input name="loginId" id="loginId">
      <br/>
      <span class="error" id="err-loginId"></span>
    </span>
    <label for="pw"><slot name="pwLabel">Password:</slot></label>
    <span>
      <input name="pw" id="pw" type="password">
      <br/>
      <span class="error" id="err-pw"></span>
    </span>
    <label></label>
    <button class="submit" type="submit">
      <slot name=submitLabel>Login</slot>
    </button>
  </form>
`; //dialog element not supported in Firefox or Safari
//tried to have text for logoutMsg and the  logoutCancel and logout buttons
//slottable.  The slot for logoutMsg worked but the buttons would not show
//up even when their slottability was removed.

const LOGOUT_WARNING_HTML = `
  <dialog id="logoutDialog">
    <form method="dialog">
      <span id="logoutMsg">
        You will be logged out due to inactivity in \${seconds} seconds
      </span>
      <menu>
        <button type="submit" id="logoutCancel" value="logoutCancel">
          Continue
        </button>
        <button type="submit" id="logout" value="logout">
          Logout
        </button>
      </menu>
    </form>
  </dialog>
`;
const APP_HTML = `
  <slot id="app" name="app">App not defined</slot>
`; //customElements.define('login-app', LoginApp);
},{"./login-ws.mjs":"../../node_modules/login-app/src/login-ws.mjs","./utils.mjs":"../../node_modules/login-app/src/utils.mjs"}],"../../node_modules/login-app/src/logout.mjs":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

class Logout extends HTMLElement {
  constructor() {
    super();
    this.sessionId = this.getAttribute('sessionId');
    console.assert(this.sessionId);
    this.attachShadow({
      mode: 'open'
    });
    this.logout = this.logout.bind(this);
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = HTML;
    this.shadowRoot.getElementById('logoutForm').addEventListener('submit', this.logout);
  }

  async logout(ev) {
    ev.preventDefault();
    const loginApp = closestThruShadow(this, 'login-app');
    await loginApp.logout(this.sessionId);
  }

}
/** like el.closest(sel), but pierce shadow boundaries */


exports.default = Logout;

function closestThruShadow(el, sel) {
  return !el || el === document || el === window ? null : el.closest(sel) ?? closestThruShadow(el.getRootNode().host, sel);
}

const STYLE = `
  :host {
    display: block;
  }
  :host([hidden]) {
    display: none;
  }

  .logout {
    padding: 3em;
  }
`;
const HTML = `
  <style>${STYLE}</style>
  <span id="logout">
    <form id="logoutForm" method="POST">
      <button type="submit">Logout</button>
    </form>
  </span>
`; //customElements.define('do-logout', Logout);
},{}],"../../node_modules/login-app/main.mjs":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _loginApp = _interopRequireDefault(require("./src/login-app.mjs"));

var _logout = _interopRequireDefault(require("./src/logout.mjs"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _default = {
  LoginApp: _loginApp.default,
  Logout: _logout.default
};
exports.default = _default;
},{"./src/login-app.mjs":"../../node_modules/login-app/src/login-app.mjs","./src/logout.mjs":"../../node_modules/login-app/src/logout.mjs"}],"../../node_modules/cs544-js-utils/src/utils.mjs":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AppErrors = void 0;

class AppErrors {
  constructor() {
    this.errors = [];
  }

  add(...args) {
    console.assert(args.length === 1 || args.length === 2);
    let message, options;

    if (args.length === 2) {
      [message, options] = args;
    } else if (Array.isArray(args[0])) {
      args[0].forEach(err => this.add(err));
    } else if (args[0].errors) {
      this.add(args[0].errors);
    } else {
      ({
        message,
        options
      } = args[0]);
      if (!message) message = args[0].toString();
      if (!options) options = {};
    }

    this.errors.push({
      message,
      options
    });
    return this;
  }

  toString() {
    return this.errors.map(e => e.message).join('\n');
  }

}

exports.AppErrors = AppErrors;
},{}],"../../node_modules/cs544-js-utils/main.mjs":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _utils = require("./src/utils.mjs");

var _default = {
  AppErrors: _utils.AppErrors
};
exports.default = _default;
},{"./src/utils.mjs":"../../node_modules/cs544-js-utils/src/utils.mjs"}],"../js/grades-ws.mjs":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _cs544JsUtils = _interopRequireDefault(require("cs544-js-utils"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const {
  AppErrors
} = _cs544JsUtils.default;

class GradesWs {
  constructor(url) {
    this.url = url;
  }
  /** Make a `GET` request to /:courseId/grades?queryParams.
   *  Return success object or object having an errors
   *  property.
   */


  async grades(courseId, queryParams) {
    // TODO
    try {
      ///${queryParams}
      const qparams = new URLSearchParams(queryParams);
      const response = await fetch(`${this.url}/${courseId}/grades/?${qparams}`); //return await responseResult(response);

      return await response.json();
    } catch (err) {
      return new AppErrors().add(err);
    }
  }
  /** Make a `GET` request to /:courseId/raw?queryParams.
   *  Return success object or object having an errors
   *  property.
   */


  async raw(courseId, queryParams) {
    // Not required for this project.
    return null;
  }
  /** Make a `GET` request to
   *  /:courseId/students/:studentId?queryParams.  Return success
   *  object or object having an errors property.
   */


  async student(courseId, studentId, queryParams) {
    // TOD
    try {
      const qparams = new URLSearchParams(queryParams);
      const response = await fetch(`${this.url}/${courseId}/students/${studentId}/?${qparams}`); //return `dummy ${studentId} student grades for "${courseId}"`;

      return await response.json();
    } catch (err) {
      return new AppErrors().add(err);
    }
  }
  /** Make a `PATCH` request to /courseId/grades?queryParams passing
   *  updates as request body.  Return success object or object having
   *  an errors property.
   */


  async update(courseId, queryParams, updates) {
    // Not required for this project.
    return null;
  }

}

exports.default = GradesWs;
},{"cs544-js-utils":"../../node_modules/cs544-js-utils/main.mjs"}],"../../node_modules/courses-info/src/course-info-fns.mjs":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

class CourseInfoFns {
  /** Return those columns in row whose colId's match regex */
  static colIdMatchFilter(regex) {
    return row => {
      const pairs = Object.entries(row);
      const filteredPairs = pairs.filter(([k, v]) => regex.test(k));
      return Object.fromEntries(filteredPairs);
    };
  }
  /** Return those columns in row having colId in colIds. */


  static colIdsFilter(colIds) {
    return row => {
      const pairs = Object.entries(row);
      const filteredPairs = pairs.filter(([k, v]) => colIds.indexOf(k) >= 0);
      return Object.fromEntries(filteredPairs);
    };
  }
  /** Return those columns in row which remain after dropping nDrop
   *  lowest grades.
   */


  static minDropFilter(nDrop = 1) {
    return row => {
      const pairs = Object.entries(row);
      const zeroed = pairs.map(([k, v]) => [k, CourseInfoFns.val(v)]);
      const sorted = zeroed.sort(([k1, v1], [k2, v2]) => v1 - v2);
      const selKeys = sorted.slice(nDrop).map(([k, v]) => k);
      const selPairs = pairs.filter(([k, v]) => selKeys.indexOf(k) >= 0);
      return Object.fromEntries(selPairs);
    };
  }
  /** Return weighted sum of row according to colId to weight in
   *  object colIdWeights
   */


  static weightedSumAggregate(colIdWeights) {
    const val = CourseInfoFns.val;
    return row => {
      const sum = Object.entries(colIdWeights).reduce((acc, [colId, w]) => acc + w * val(row[colId]), 0);
      return Number(sum.toFixed(1));
    };
  }
  /** Given a list cutoffPairs of pairs [geBound, value], return
   *  value for the greatest geBound such that row[colId] >=
   *  geBound.
   */


  static cutoffAggregate(colId, cutoffPairs) {
    const sortedPairs = cutoffPairs.sort(([c1, v1], [c2, v2]) => c2 - c1);
    return row => {
      const grade = CourseInfoFns.val(row[colId]);
      return sortedPairs.find(([c, v]) => grade >= c)[1];
    };
  }

  static maxAggregate(dropEmpty = false) {
    return rawGrades => {
      return Math.max(...CourseInfoFns._cleanGrades(rawGrades, dropEmpty));
    };
  }

  static minAggregate(dropEmpty = false) {
    return rawGrades => {
      return Math.min(...CourseInfoFns._cleanGrades(rawGrades, dropEmpty));
    };
  }

  static avgAggregate(dropEmpty = false) {
    return rawGrades => {
      const cleaned = CourseInfoFns._cleanGrades(rawGrades, dropEmpty);

      const sum = cleaned.reduce((acc, g) => acc + g, 0);
      const count = cleaned.length;
      return count === 0 ? 0 : Number((sum / count).toFixed(1));
    };
  }

  static countAggregate(dropEmpty = false) {
    return rawGrades => {
      return CourseInfoFns._cleanGrades(rawGrades, dropEmpty).length;
    };
  }

  static val(g) {
    return typeof g === 'number' ? g : 0;
  }

  static _cleanGrades(data, dropEmpty) {
    const isNum = g => typeof g === 'number';

    const rawGrades = Array.isArray(data) ? data : Object.values(data);
    const dropped = dropEmpty ? rawGrades.filter(g => isNum(g)) : rawGrades;
    return dropped.map(g => CourseInfoFns.val(g));
  }

}

exports.default = CourseInfoFns;
},{}],"../../node_modules/courses-info/src/cs471-info.mjs":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _courseInfoFns = _interopRequireDefault(require("./course-info-fns.mjs"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const LAB_TOTAL = 7;
const WEIGHTS = {
  'talk': 1,
  '$lab': 1,
  '$qAvg': 1,
  '$pAvg': 0.24,
  '$hAvg': 0.20,
  'mid': 0.15,
  'fin': 0.20
}; //These are dummy values

const LETTER_GRADE_CUTOFFS = [[95, 'A'], [90, 'A-'], [85, 'B+'], [80, 'B'], [77, 'B-'], [70, 'C+'], [65, 'C'], [60, 'C-'], [50, 'D'], [0, 'F']];

function rowAggregate(regex, aggregateId) {
  return {
    aggregateId,
    filters: [_courseInfoFns.default.colIdMatchFilter(regex), _courseInfoFns.default.minDropFilter(1)],
    aggregateFn: _courseInfoFns.default.avgAggregate(false)
  };
}

const CS471_INFO = {
  id: 'cs471',
  name: 'Programming Languages',
  rawColInfos: [{
    colIdRegex: /^emailId$/,
    contentRegex: /^\w+$/
  }, {
    colIdRegex: /^prj\d+$/
  }, {
    colIdRegex: /^hw\d+$/
  }, {
    colIdRegex: /^qz\d+$/,
    hi: 12
  }, {
    colIdRegex: /^lab\d+$/,
    lo: -1,
    hi: 0
  }, {
    colIdRegex: /^mid$/
  }, {
    colIdRegex: /^fin$/
  }, {
    colIdRegex: /^talk$/,
    hi: 3
  }],
  rowAggregates: [rowAggregate(/^prj\d+$/, '$pAvg'), rowAggregate(/^hw\d+$/, '$hAvg'), rowAggregate(/^qz\d+$/, '$qAvg'), {
    aggregateId: '$lab',
    filters: [_courseInfoFns.default.colIdMatchFilter(/^lab\d+$/)],
    aggregateFn: row => {
      const sum = Object.values(row).reduce((acc, v) => _courseInfoFns.default.val(v) + acc, 0);
      return LAB_TOTAL + sum < 0 ? 0 : LAB_TOTAL + sum;
    }
  }, {
    aggregateId: '$total',
    aggregateFn: _courseInfoFns.default.weightedSumAggregate(WEIGHTS)
  }, {
    aggregateId: '$grade',
    aggregateFn: _courseInfoFns.default.cutoffAggregate('$total', LETTER_GRADE_CUTOFFS)
  }],
  statColId: '$stats',
  colAggregates: [{
    aggregateId: '$avg',
    aggregateFn: _courseInfoFns.default.avgAggregate(true)
  }, {
    aggregateId: '$min',
    aggregateFn: _courseInfoFns.default.minAggregate(true)
  }, {
    aggregateId: '$max',
    aggregateFn: _courseInfoFns.default.maxAggregate(true)
  }, {
    aggregateId: '$count',
    aggregateFn: _courseInfoFns.default.countAggregate(true)
  }]
};
var _default = CS471_INFO;
exports.default = _default;
},{"./course-info-fns.mjs":"../../node_modules/courses-info/src/course-info-fns.mjs"}],"../../node_modules/courses-info/src/cs544-info.mjs":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _courseInfoFns = _interopRequireDefault(require("./course-info-fns.mjs"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const CS444_WEIGHTS = {
  '$qAvg': 1,
  '$pAvg': 0.35,
  '$hAvg': 0.25,
  'mid': 0.13,
  'fin': 0.15
};
const CS544_WEIGHTS = {
  '$qAvg': 1,
  '$pAvg': 0.35,
  '$hAvg': 0.22,
  'pap': 1,
  'mid': 0.13,
  'fin': 0.15
}; //These are dummy values

const LETTER_GRADE_CUTOFFS = [[96, 'A'], [90.5, 'A-'], [85.3, 'B+'], [80.5, 'B'], [77, 'B-'], [70, 'C+'], [65, 'C'], [60, 'C-'], [50, 'D'], [0, 'F']];

function rowAggregate(regex, aggregateId) {
  return {
    aggregateId,
    filters: [_courseInfoFns.default.colIdMatchFilter(regex), _courseInfoFns.default.minDropFilter(1)],
    aggregateFn: _courseInfoFns.default.avgAggregate(false)
  };
}

const CS544_INFO = {
  id: 'cs544',
  name: 'Programming for the Web',
  rawColInfos: [{
    colIdRegex: /^emailId$/,
    contentRegex: /^\w+$/
  }, {
    colIdRegex: /^section$/,
    contentRegex: /^\w+$/
  }, {
    colIdRegex: /^prj\d+$/
  }, {
    colIdRegex: /^hw\d+$/
  }, {
    colIdRegex: /^qz\d+$/,
    hi: 12
  }, {
    colIdRegex: /^mid$/
  }, {
    colIdRegex: /^fin$/
  }, {
    colIdRegex: /^pap$/,
    hi: 3
  }],
  rowAggregates: [rowAggregate(/^prj\d+$/, '$pAvg'), rowAggregate(/^hw\d+$/, '$hAvg'), rowAggregate(/^qz\d+$/, '$qAvg'), {
    aggregateId: '$total',
    aggregateFn: function (row) {
      return row.section === 'cs444' ? _courseInfoFns.default.weightedSumAggregate(CS444_WEIGHTS)(row) : _courseInfoFns.default.weightedSumAggregate(CS544_WEIGHTS)(row);
    }
  }, {
    aggregateId: '$grade',
    aggregateFn: _courseInfoFns.default.cutoffAggregate('$total', LETTER_GRADE_CUTOFFS)
  }],
  statColId: '$stats',
  colAggregates: [{
    aggregateId: '$avg',
    aggregateFn: _courseInfoFns.default.avgAggregate(true)
  }, {
    aggregateId: '$min',
    aggregateFn: _courseInfoFns.default.minAggregate(true)
  }, {
    aggregateId: '$max',
    aggregateFn: _courseInfoFns.default.maxAggregate(true)
  }, {
    aggregateId: '$count',
    aggregateFn: _courseInfoFns.default.countAggregate(true)
  }]
};
var _default = CS544_INFO;
exports.default = _default;
},{"./course-info-fns.mjs":"../../node_modules/courses-info/src/course-info-fns.mjs"}],"../../node_modules/courses-info/src/course-info.mjs":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getCourseInfo = exports.default = getCourseInfo;
exports.getCourseIds = getCourseIds;

var _cs471Info = _interopRequireDefault(require("./cs471-info.mjs"));

var _cs544Info = _interopRequireDefault(require("./cs544-info.mjs"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const COURSE_INFOS = {
  cs471: _cs471Info.default,
  cs544: _cs544Info.default
};
const COURSE_IDS = Object.keys(COURSE_INFOS);

function getCourseInfo(courseId) {
  const info = COURSE_INFOS[courseId];

  if (info) {
    return info;
  } else {
    const message = `unknown course ${courseId}`;
    const options = {
      code: 'NOT_FOUND'
    };
    return {
      errors: [{
        message,
        options,
        //backward compatibility with prj3
        _msg: message,
        _options: options
      }]
    };
  }
}

function getCourseIds() {
  return COURSE_IDS;
}
/*

//cannot load dynamically on web, above code does static

import { AppError } from 'course-grades';

export default async function getCourseInfo(courseId) {
  const errors = [];
  let courseInfo;
  const infoPath = `./${courseId}-info.mjs`;
  try {
    const content = await import(infoPath);
    courseInfo = content.default;
  }
  catch (err) {
    if (isUnknownModuleError(err)) {
      const msg = `unknown course "${courseId}"`;
      errors.push(new AppError(msg, { code: 'NOT_FOUND' }));
    }
    else {
      const msg = `unable to read ${infoPath}: ${err}`;
      errors.push(new AppError(msg, { code: 'INTERNAL' }));
    }
  }
  return (errors.length > 0) ? { errors } : courseInfo;
}

function isUnknownModuleError(err) {
  return (err.constructor === 'TypeError') //chrome and firefox
    || (err.message && err.message.startsWith('Cannot find module')); //node
}
*/
},{"./cs471-info.mjs":"../../node_modules/courses-info/src/cs471-info.mjs","./cs544-info.mjs":"../../node_modules/courses-info/src/cs544-info.mjs"}],"../../node_modules/courses-info/main.mjs":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "getCourseInfo", {
  enumerable: true,
  get: function () {
    return _courseInfo.getCourseInfo;
  }
});
Object.defineProperty(exports, "getCourseIds", {
  enumerable: true,
  get: function () {
    return _courseInfo.getCourseIds;
  }
});
exports.default = void 0;

var _courseInfo = require("./src/course-info.mjs");

var _default = _courseInfo.getCourseInfo; //backward compatibility

exports.default = _default;
},{"./src/course-info.mjs":"../../node_modules/courses-info/src/course-info.mjs"}],"../js/grades-app.mjs":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _gradesWs = _interopRequireDefault(require("./grades-ws.mjs"));

var _coursesInfo = require("courses-info");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class GradesApp extends HTMLElement {
  constructor() {
    super();
    this.wsUrl = this.getAttribute('ws-url');
    this.gradesWs = new _gradesWs.default(this.wsUrl);
    this.grades = {};
    this.courseInfos = {};
    this.addEventListener('login', this.login);
    this.addEventListener('logout', this.logout);
    this.attachShadow({
      mode: 'open'
    });
    this.shadowRoot.addEventListener('click', this.click.bind(this));
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = 'hello from grades-app!!';
    this.grades = {};
    this.courseInfos = {};
  }

  disconnectedCallback() {}

  click(ev) {
    if (ev.target.classList.contains('select-course')) {
      ev.preventDefault();
      this.selectCourse(ev);
    } else if (ev.target.classList.contains('courses')) {
      ev.preventDefault();
      this.tableWidget = null;
      this.paintContainer();
    }
  }

  selectCourse(ev) {
    const courseId = ev.target.getAttribute('data-courseId');
    const tableWidget = this.tableWidget = document.createElement('grades-table');
    tableWidget.courseId = courseId;
    tableWidget.courseInfo = this.courseInfos[courseId];
    tableWidget.gradesTable = this.grades[courseId];
    this.paintContainer();
  }

  async login(ev) {
    const sessionInfo = this.sessionInfo = ev.detail;
    const {
      sessionId
    } = sessionInfo;
    this.shadowRoot.innerHTML = `
       ${STYLE}
       <div class="container"></div>
       <do-logout sessionId=${sessionId}></do-logout>
    `;
    const courseIds = (0, _coursesInfo.getCourseIds)();
    const adminCourseIds = getAdminCourseIds(courseIds, sessionInfo.roles, 'read');
    const isAdmin = adminCourseIds.length > 0;
    const selectedCourseIds = isAdmin ? adminCourseIds : courseIds;
    const courseInfos = await getCourseInfos(selectedCourseIds);

    if (courseInfos.errors) {
      this.displayErrors(courseInfos);
      return;
    }

    const grades = await this.getCourseGrades(selectedCourseIds, isAdmin);

    if (grades.errors) {
      this.displayErrors(grades);
      return;
    }

    this.grades = grades;
    this.courseInfos = courseInfos;
    this.paintContainer();
  }

  logout(ev) {
    delete this.grades;
    delete this.courseInfos;
    delete this.sessionInfo;
    delete this.tableWidget;
    const container = this.shadowRoot.querySelector('.container');
    container.innerHTML = '';
  }

  async getCourseGrades(courseIds, isAdmin) {
    const grades = {};
    const {
      loginId,
      sessionId
    } = this.sessionInfo;
    const wsName = isAdmin ? 'grades' : 'student';

    for (const courseId of courseIds) {
      const courseGrades = isAdmin ? await this.gradesWs.grades(courseId, {
        sessionId
      }) : await this.gradesWs.student(courseId, loginId, {
        sessionId
      });

      if (courseGrades.errors) {
        var _courseGrades$errors$, _courseGrades$errors$2;

        if (isAdmin || ((_courseGrades$errors$ = courseGrades.errors[0]) === null || _courseGrades$errors$ === void 0 ? void 0 : (_courseGrades$errors$2 = _courseGrades$errors$.options) === null || _courseGrades$errors$2 === void 0 ? void 0 : _courseGrades$errors$2.code) != 'NOT_FOUND') {
          return courseGrades;
        }
      } else {
        grades[courseId] = courseGrades;
      }
    }

    console.log('grades.len = ', Object.keys(grades).length);
    return grades;
  }

  displayErrors(errorRet) {
    const container = this.shadowRoot.querySelector('.container');
    const errItems = errorRet.errors.map(e => {
      var _e$message;

      return `<ul>${(_e$message = e.message) !== null && _e$message !== void 0 ? _e$message : e.toString()}</ul>`;
    });
    container.innerHTML = `<ul class="error">${errItems.join('\n')}</ul>`;
  }

  paintContainer() {
    const container = this.shadowRoot.querySelector('.container');
    const courseIds = Object.keys(this.grades);
    const hasCourses = courseIds.length > 0;

    if (courseIds.length === 0) {
      container.innerHTML = `
        <span class="message">Sorry, you do not have any courses.</span>
      `;
    } else if (this.tableWidget) {
      this.paintTableWidget(container);
    } else {
      this.paintCourseSelects(container);
    }
  }

  paintCourseSelects(container) {
    let html = '';

    for (const id of Object.keys(this.grades)) {
      html += `
        <p><a href="#" class="select-course"data-courseId=${id}>
          ${this.courseInfos[id].name}
        </a></p>
      `;
    }

    container.innerHTML = html;
  }

  paintTableWidget(container) {
    container.innerHTML = '';
    container.append(this.tableWidget);
    const html = `
      <p><a class="courses" href="#">Back to Course Selections</a></p>
    `;
    container.insertAdjacentHTML('beforeend', html);
  }

}
/** Return those courses for which role permits perm. */


exports.default = GradesApp;

function getAdminCourseIds(courses, roles, perm) {
  const adminCourses = [];

  for (const course of courses) {
    var _roles$course;

    const perms = (_roles$course = roles[course]) !== null && _roles$course !== void 0 ? _roles$course : [];
    if (perms.indexOf(perm) >= 0) adminCourses.push(course);
  }

  return adminCourses;
}

async function getCourseInfos(courseIds) {
  const courseInfos = {};

  for (const courseId of courseIds) {
    const courseInfo = await (0, _coursesInfo.getCourseInfo)(courseId);
    if (courseInfo.errors) return courseInfo;
    courseInfos[courseId] = courseInfo;
  }

  return courseInfos;
}

const STYLE = `
<style>
  .message { 
    color: red; 
    padding: 4em;
  }
  .error {
    color: red;
  }
</style>
`;
},{"./grades-ws.mjs":"../js/grades-ws.mjs","courses-info":"../../node_modules/courses-info/main.mjs"}],"../js/grades-table.mjs":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

class GradesApp extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({
      mode: 'open'
    });
  }
  /** Called when this element instance has been added/moved
   *  in the DOM.  Will have courseId, courseInfo and
   *  gradesTable properties.
   */


  connectedCallback() {
    const {
      courseId,
      courseInfo,
      gradesTable
    } = this;
    let html = STYLE; //html += `<pre>${JSON.stringify(this, null, 2)}</pre>`;
    // TODO: replace above line which builds out component as per spec.

    var header = Object.keys(Object.values(gradesTable)[0]); //var header = Object.keys(a);

    var total = "<th>";

    for (var i = 0; i < header.length; i++) {
      total += header[i] + "</th>";

      if (i != header.length - 1) {
        total += "<th>";
      }
    }

    html += `<table class="grades">`;
    html += `<tr>`;
    html += total;
    html += `</tr>`;
    html += `<tr>`;

    for (var i = 0; i < gradesTable.length; i++) {
      //html += `<th>${Object.keys(Object.values(gradesTable)[i])}</th>`;
      var content = Object.values(Object.values(gradesTable)[i]); //var header2= Object.keys(Object.values(gradesTable)[i]);

      var total = "<td>";

      for (var j = 0; j < content.length; j++) {
        // Burasi bos cell ekleme yeri
        //if(header2[j] === undefined){header[j] =  "<td></td><td></td>"}
        total += content[j] + "</td>";

        if (j != content.length - 1) {
          total += "<td>";
        }
      } //html += `<table class="grades">`


      html += `<tr>`;
      html += total;
      html += `</tr>`;
    }

    console.log(html); //html += `</tr>`

    html += `</table>`; // for (var i = 0; i < 5; i++) {
    //	html += `<h2>${gradesTable[i].emailId}<h2>`;
    //}
    //html +=${courseInfo.name}</h2>

    html += `<table class="grades">`;
    this.shadowRoot.innerHTML = html;
  }
  /** Called when this element instance is removed from the DOM.
   */


  disconnectedCallback() {}

}

exports.default = GradesApp;
const STYLE = `
<style>
.grades {
  margin: 10px;
  border-collapse: collapse;
}

.grades td {
  background-color: lightcyan;
  text-align: right;
}

.grades th {
  background-color: paleturquoise;
  font-weight: bold;
  text-align: center;
}
.grades td,
.grades th {
  min-width: 40px;
  pointer: default;
  border: 1px solid gray;
}

.grades tr:hover {
  background-color: aquamarine;
}
.grades tr:hover td {
  background-color: transparent;
}
</style>
`;
},{}],"../js/index.mjs":[function(require,module,exports) {
"use strict";

var _loginApp = _interopRequireDefault(require("login-app"));

var _gradesApp = _interopRequireDefault(require("./grades-app.mjs"));

var _gradesTable = _interopRequireDefault(require("./grades-table.mjs"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//this file necessary because parcel doesn't allow imports
//within inline script elements
customElements.define('login-app', _loginApp.default.LoginApp);
customElements.define('do-logout', _loginApp.default.Logout);
customElements.define('grades-app', _gradesApp.default);
customElements.define('grades-table', _gradesTable.default);
},{"login-app":"../../node_modules/login-app/main.mjs","./grades-app.mjs":"../js/grades-app.mjs","./grades-table.mjs":"../js/grades-table.mjs"}],"../../node_modules/parcel-bundler/src/builtins/hmr-runtime.js":[function(require,module,exports) {
var global = arguments[3];
var OVERLAY_ID = '__parcel__error__overlay__';
var OldModule = module.bundle.Module;

function Module(moduleName) {
  OldModule.call(this, moduleName);
  this.hot = {
    data: module.bundle.hotData,
    _acceptCallbacks: [],
    _disposeCallbacks: [],
    accept: function (fn) {
      this._acceptCallbacks.push(fn || function () {});
    },
    dispose: function (fn) {
      this._disposeCallbacks.push(fn);
    }
  };
  module.bundle.hotData = null;
}

module.bundle.Module = Module;
var checkedAssets, assetsToAccept;
var parent = module.bundle.parent;

if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== 'undefined') {
  var hostname = "" || location.hostname;
  var protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  var ws = new WebSocket(protocol + '://' + hostname + ':' + "33989" + '/');

  ws.onmessage = function (event) {
    checkedAssets = {};
    assetsToAccept = [];
    var data = JSON.parse(event.data);

    if (data.type === 'update') {
      var handled = false;
      data.assets.forEach(function (asset) {
        if (!asset.isNew) {
          var didAccept = hmrAcceptCheck(global.parcelRequire, asset.id);

          if (didAccept) {
            handled = true;
          }
        }
      }); // Enable HMR for CSS by default.

      handled = handled || data.assets.every(function (asset) {
        return asset.type === 'css' && asset.generated.js;
      });

      if (handled) {
        console.clear();
        data.assets.forEach(function (asset) {
          hmrApply(global.parcelRequire, asset);
        });
        assetsToAccept.forEach(function (v) {
          hmrAcceptRun(v[0], v[1]);
        });
      } else if (location.reload) {
        // `location` global exists in a web worker context but lacks `.reload()` function.
        location.reload();
      }
    }

    if (data.type === 'reload') {
      ws.close();

      ws.onclose = function () {
        location.reload();
      };
    }

    if (data.type === 'error-resolved') {
      console.log('[parcel] ✨ Error resolved');
      removeErrorOverlay();
    }

    if (data.type === 'error') {
      console.error('[parcel] 🚨  ' + data.error.message + '\n' + data.error.stack);
      removeErrorOverlay();
      var overlay = createErrorOverlay(data);
      document.body.appendChild(overlay);
    }
  };
}

function removeErrorOverlay() {
  var overlay = document.getElementById(OVERLAY_ID);

  if (overlay) {
    overlay.remove();
  }
}

function createErrorOverlay(data) {
  var overlay = document.createElement('div');
  overlay.id = OVERLAY_ID; // html encode message and stack trace

  var message = document.createElement('div');
  var stackTrace = document.createElement('pre');
  message.innerText = data.error.message;
  stackTrace.innerText = data.error.stack;
  overlay.innerHTML = '<div style="background: black; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; opacity: 0.85; font-family: Menlo, Consolas, monospace; z-index: 9999;">' + '<span style="background: red; padding: 2px 4px; border-radius: 2px;">ERROR</span>' + '<span style="top: 2px; margin-left: 5px; position: relative;">🚨</span>' + '<div style="font-size: 18px; font-weight: bold; margin-top: 20px;">' + message.innerHTML + '</div>' + '<pre>' + stackTrace.innerHTML + '</pre>' + '</div>';
  return overlay;
}

function getParents(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return [];
  }

  var parents = [];
  var k, d, dep;

  for (k in modules) {
    for (d in modules[k][1]) {
      dep = modules[k][1][d];

      if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) {
        parents.push(k);
      }
    }
  }

  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id));
  }

  return parents;
}

function hmrApply(bundle, asset) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (modules[asset.id] || !bundle.parent) {
    var fn = new Function('require', 'module', 'exports', asset.generated.js);
    asset.isNew = !modules[asset.id];
    modules[asset.id] = [fn, asset.deps];
  } else if (bundle.parent) {
    hmrApply(bundle.parent, asset);
  }
}

function hmrAcceptCheck(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (!modules[id] && bundle.parent) {
    return hmrAcceptCheck(bundle.parent, id);
  }

  if (checkedAssets[id]) {
    return;
  }

  checkedAssets[id] = true;
  var cached = bundle.cache[id];
  assetsToAccept.push([bundle, id]);

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    return true;
  }

  return getParents(global.parcelRequire, id).some(function (id) {
    return hmrAcceptCheck(global.parcelRequire, id);
  });
}

function hmrAcceptRun(bundle, id) {
  var cached = bundle.cache[id];
  bundle.hotData = {};

  if (cached) {
    cached.hot.data = bundle.hotData;
  }

  if (cached && cached.hot && cached.hot._disposeCallbacks.length) {
    cached.hot._disposeCallbacks.forEach(function (cb) {
      cb(bundle.hotData);
    });
  }

  delete bundle.cache[id];
  bundle(id);
  cached = bundle.cache[id];

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    cached.hot._acceptCallbacks.forEach(function (cb) {
      cb();
    });

    return true;
  }
}
},{}]},{},["../../node_modules/parcel-bundler/src/builtins/hmr-runtime.js","../js/index.mjs"], null)
//# sourceMappingURL=/js.af3639f1.js.map