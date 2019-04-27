# moleculer-insee-sirene

[![Build Status](https://travis-ci.org/YourSoftRun/moleculer-insee-sirene.svg?branch=master)](https://travis-ci.org/YourSoftRun/moleculer-insee-sirene)
[![Coverage Status](https://coveralls.io/repos/github/YourSoftRun/moleculer-insee-sirene/badge.svg?branch=master)](https://coveralls.io/github/YourSoftRun/moleculer-insee-sirene?branch=master)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/f2dcccf3dbe7425d8d25cea75b595ff6)](https://www.codacy.com/app/Hugome/moleculer-insee-sirene?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=YourSoftRun/moleculer-insee-sirene&amp;utm_campaign=Badge_Grade)
[![Maintainability](https://api.codeclimate.com/v1/badges/acd3800be514523fc39f/maintainability)](https://codeclimate.com/github/YourSoftRun/moleculer-insee-sirene/maintainability)
[![David](https://img.shields.io/david/YourSoftRun/moleculer-insee-sirene.svg)](https://david-dm.org/YourSoftRun/moleculer-insee-sirene)
[![Known Vulnerabilities](https://snyk.io/test/github/YourSoftRun/moleculer-insee-sirene/badge.svg)](https://snyk.io/test/github/YourSoftRun/moleculer-insee-sirene)

[![Downloads](https://img.shields.io/npm/dm/moleculer-insee-sirene.svg)](https://www.npmjs.com/package/moleculer-insee-sirene)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FYourSoftRun%2Fmoleculer-insee-sirene.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2FYourSoftRun%2Fmoleculer-insee-sirene?ref=badge_shield)

## How to use it
```js
const InseeSireneMixin = require('moleculer-insee-sirene')

module.exports = {
  mixins: [InseeSireneMixin],
  settings: {
    /** @type {Object} Keys given by https://api.insee.fr/catalogue/site/themes/wso2/subthemes/insee/pages/item-info.jag?name=Sirene&version=V3&provider=insee. */
    keys: {
      /** @type {String} Consumer key given by INSEE */
      key: '',
      /** @type {String} Consumer secret given by INSEE */
      secret: ''
    }
  }
}
```
