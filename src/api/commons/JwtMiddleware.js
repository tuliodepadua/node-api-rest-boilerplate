'use strict';

const jwt = require('jsonwebtoken');
const HttpController = require('../../commons/HttpController');

class JwtMiddleware extends HttpController {
  constructor() {
    super();
    this.process = this.process.bind(this);
    this.nextIfHasToken = this.nextIfHasToken.bind(this);
    this.rootApi = process.env.ROOT_API_PATH || '/api';
    this.noAuthRoutes = process.env.NO_AUTH_ROUTES ? process.env.NO_AUTH_ROUTES.split(';') : [];
    this.noTokenApis = [];
    this._getNoAuthRoutes();
  }

  _checkRequestToken(req, res, next) {
    try {
      const token = this._getTokenFromHeader(req);
      const tokenData = jwt.verify(token, process.env.JWT_SECRET);
      req.token = tokenData;
      next();
    } catch (error) {
      this.responseError(res, next, this.Messages.INVALID_TOKEN);
    }
  }

  _getTokenFromHeader(req) {
    const authorization = req.headers.authorization;
    const token = authorization ? authorization.split(/(\s+)/)[2] : '';
    return token;
  }

  _getNoAuthRoutes() {
    for (const route of this.noAuthRoutes) {
      const [path, methodsStr] = route.split('|');

      if (path) {
        const noAuthItem = { path };
        if (methodsStr) {
          noAuthItem.methods = methodsStr.split(',');
        }
        this.noTokenApis.push(noAuthItem);
      }
    }
  }

  _checkNoAuthRoutes(req) {
    const endpoint = req.originalUrl;
    for (const item of this.noTokenApis) {
      if (endpoint.includes(item.path) && (!item.methods || item.methods.includes(req.method))) {
        return true;
      }
    }
    return false;
  }

  nextIfHasToken(req, res, next) {
    if (req.token || this._checkNoAuthRoutes(req)) {
      next();
    }
  }

  process(req, res, next) {
    if (this._checkNoAuthRoutes(req)) {
      next();
    } else {
      this._checkRequestToken(req, res, next);
    }
  }

  initialize() {
    return this.process;
  }
}

module.exports = new JwtMiddleware();
