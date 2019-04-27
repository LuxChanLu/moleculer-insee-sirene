/*
 * moleculer-insee-sirene
 * Copyright (c) 2019 YourSoft.run (https://github.com/YourSoftRun/moleculer-insee-sirene)
 * MIT Licensed
 */

'use strict'

const fetch = require('node-fetch')
const btoa = require('btoa')
const qs = require('qs')
const { MoleculerError } = require('moleculer').Errors

const INSEE_API_ENDPOINT = 'https://api.insee.fr'
const TOKEN_API_ENDPOINT = `${INSEE_API_ENDPOINT}/token`
const SIRENE_API_ENDPOINT = `${INSEE_API_ENDPOINT}/entreprises/sirene/V3`

module.exports = {
  name: 'insee.sirene',

  /**
	 * Default settings
	 */
  settings: {
    /** @type {Object} Keys given by https://api.insee.fr/catalogue/site/themes/wso2/subthemes/insee/pages/item-info.jag?name=Sirene&version=V3&provider=insee. */
    keys: {
      /** @type {String} Consumer key given by INSEE */
      key: undefined,
      /** @type {String} Consumer secret given by INSEE */
      secret: undefined
    },
    /** @type {String} Acess token cache key name, can be null to disable */
    cache: 'insee.token'
  },

  /**
	 * Hooks
	 */
  hooks: {
    before: {
      '*': 'loginInseeApp'
    }
  },

  /**
	 * Actions
	 */
  actions: {
    siren: {
      async handler(ctx) {
        const { siren, date, champs, masquerValeursNulles } = ctx.params
        if (siren) {
          return (await fetch(`${SIRENE_API_ENDPOINT}/siren/${siren}?${qs.stringify({ date, champs, masquerValeursNulles })}`, { headers: await this.inseeHeader() })).json()
        } else {
          return (await fetch(`${SIRENE_API_ENDPOINT}/siren`, { method: 'POST', body: ctx.params, headers: await this.inseeHeader() })).json()
        }
      }
    },
    siret: {
      async handler(ctx) {
        const { siret, date, champs, masquerValeursNulles } = ctx.params
        if (siret) {
          return (await fetch(`${SIRENE_API_ENDPOINT}/siret/${siret}?${qs.stringify({ date, champs, masquerValeursNulles })}`, { headers: await this.inseeHeader() })).json()
        } else {
          return (await fetch(`${SIRENE_API_ENDPOINT}/siret`, { method: 'POST', body: ctx.params, headers: await this.inseeHeader() })).json()
        }
      }
    },
    'siret.succession': {
      async handler(ctx) {
        return (await fetch(`${SIRENE_API_ENDPOINT}/siret/liensSuccession?${qs.stringify(ctx.params)}`, { headers: await this.inseeHeader() })).json()
      }
    },
    informations: {
      async handler(ctx) {
        return (await fetch(`${SIRENE_API_ENDPOINT}/informations`, { headers: await this.inseeHeader() })).json()
      }
    }
  },

  /**
	 * Methods
	 */
  methods: {
    /**
		 * Get current INSEE access token
		 */
    async getInseeToken() {
      return this.broker.cacher !== null && this.settings.cache !== null ? this.broker.cacher.get(this.settings.cache) : this.token
    },

    /**
		 * Set INSEE access token
		 */
    async setInseeToken(token) {
      return this.broker.cacher && this.settings.cache ? this.broker.cacher.set(this.settings.cache, token) : (this.token = token)
    },

    /**
		 * Clear INSEE access token
		 */
    async cleanInseeToken() {
      return this.broker.cacher && this.settings.cache ? this.broker.cacher.clean(this.settings.cache) : (this.token = undefined)
    },

    /**
		 * Check if INSEE acess token valid
		 */
    async isInessTokenValid() {
      const token = await this.getInseeToken()
      return token && token.expiry >= (new Date().getTime())
    },

    /**
		 * Check current INSEE API token (Before hook)
		 */
    async checkInseeAuth() {
      if (!await this.isInessTokenValid()) {
        await this.loginInseeApp()
      }
      if (!await this.isInessTokenValid()) {
        throw new MoleculerError('Not logged to INSEE api', 500, 'INSEE_API_TOKEN_INVALID_ERROR')
      }
    },

    /**
		 * Login into INSEE API
		 */
    async loginInseeApp() {
      if (this.settings.keys && this.settings.keys.key && this.settings.keys.secret) {
        const res = await fetch(TOKEN_API_ENDPOINT, {
          method: 'POST',
          body: 'grant_type=client_credentials',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
            Authorization: `Basic ${btoa(`${this.settings.keys.key}:${this.settings.keys.secret}`)}`
          }
        })
        if (res.status !== 200) {
          throw new MoleculerError('Failed to login into INSEE api', 500, 'INSEE_API_LOGIN_ERROR', { response: await res.text() })
        }
        const { access_token, expires_in } = await res.json()
        return this.setInseeToken({ token: access_token, expiry: (new Date()).getTime() + ((expires_in - 5) * 1000) }) // To refresh 5 sec before expiration
      }
    },

    async inseeHeader() {
      return {
        Authorization: `Bearer ${(await this.getInseeToken()).token}`
      }
    },
  },
  async started() {
    try {
      await this.loginInseeApp()
    } catch (error) {
      this.logger.error(error)
    }
  },
  async stopped() {
    return this.cleanInseeToken()
  }
}
