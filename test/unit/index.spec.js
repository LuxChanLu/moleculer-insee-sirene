const fetch = require('node-fetch')
const MockDate = require('mockdate')
const { ServiceBroker } = require('moleculer')

const SirenFixture = require('./__fixtures__/siren.json')
const SiretFixture = require('./__fixtures__/siret.json')
const SirensFixture = require('./__fixtures__/sirens.json')
const SiretsFixture = require('./__fixtures__/sirets.json')
const SuccessionFixture = require('./__fixtures__/succession.json')
const InformationsFixture = require('./__fixtures__/informations.json')

const INSEESirene = require('../../index.js')

const INSEESireneWithKeys = { ...INSEESirene, settings: { keys: { key: 'key', secret: 'secret' }, cache: 'insee.token' } }

describe('INSEE Sirene authentification', () => {
  it('should not login into insee API (No keys given)', async () => {
    const broker = new ServiceBroker({ logger: false })
    const service = broker.createService(INSEESirene)
    await broker.start()
    expect(service).toBeDefined()
    expect(await service.getInseeToken()).toBeUndefined()
    await expect(service.checkInseeAuth()).rejects.toMatchObject({ type: 'INSEE_API_TOKEN_INVALID_ERROR' })
    return broker.stop()
  })

  it('should not login into insee API (Wrong keys given)', async () => {
    fetch.mockResponse(JSON.stringify({ error_description: 'A valid OAuth client could not be found', error: 'invalid_client' }), { status: 500 })
    const broker = new ServiceBroker({ logger: false })
    const service = broker.createService(INSEESireneWithKeys)
    await broker.start()
    expect(service).toBeDefined()
    expect(await service.getInseeToken()).toBeUndefined()
    await expect(service.loginInseeApp()).rejects.toMatchObject({ type: 'INSEE_API_LOGIN_ERROR' })
    await expect(service.checkInseeAuth()).rejects.toMatchObject({ type: 'INSEE_API_LOGIN_ERROR' })
    return broker.stop()
  })

  it('should login into insee API', async () => {
    MockDate.set('04/27/2019')
    fetch.mockResponse(JSON.stringify({ access_token: '683fc2bc-4319-4b14-b687-0777e423602e', scope: 'am_application_scope default', token_type: 'Bearer', expires_in: 602025 }))
    const broker = new ServiceBroker({ logger: false, cacher: 'Memory' })
    const service = broker.createService(INSEESireneWithKeys)
    await broker.start()
    expect(service).toBeDefined()
    await expect(service.getInseeToken()).resolves.toMatchObject({ token: '683fc2bc-4319-4b14-b687-0777e423602e', expiry: (new Date()).getTime() + (602020 * 1000) })
    await expect(service.inseeHeader()).resolves.toMatchObject({ Authorization: 'Bearer 683fc2bc-4319-4b14-b687-0777e423602e' })
    return broker.stop()
  })

  it('should login into insee API and refresh token', async () => {
    MockDate.set('04/27/2019')
    fetch.mockResponse(JSON.stringify({ access_token: '683fc2bc-4319-4b14-b687-0777e423602e', scope: 'am_application_scope default', token_type: 'Bearer', expires_in: 602025 }))
    const broker = new ServiceBroker({ logger: false, cacher: 'Memory' })
    const service = broker.createService({ ...INSEESireneWithKeys, settings: { ...INSEESireneWithKeys.settings, cache: null } })
    await broker.start()
    expect(service).toBeDefined()
    await expect(service.getInseeToken()).resolves.toMatchObject({ token: '683fc2bc-4319-4b14-b687-0777e423602e', expiry: (new Date()).getTime() + (602020 * 1000) })
    expect(service.isInessTokenValid()).resolves.toBeTruthy()
    await expect(service.checkInseeAuth()).resolves.toBeUndefined()
    await expect(service.getInseeToken()).resolves.toMatchObject({ token: '683fc2bc-4319-4b14-b687-0777e423602e' })
    MockDate.set('05/27/2019')
    fetch.mockResponse(JSON.stringify({ access_token: '3b2f1a80-8ee8-4c40-920b-f98a1f6ce5c7', scope: 'am_application_scope default', token_type: 'Bearer', expires_in: 602025 }))
    expect(service.isInessTokenValid()).resolves.toBeFalsy()
    await expect(service.checkInseeAuth()).resolves.toBeUndefined()
    await expect(service.getInseeToken()).resolves.toMatchObject({ token: '3b2f1a80-8ee8-4c40-920b-f98a1f6ce5c7', expiry: (new Date()).getTime() + (602020 * 1000) })
    expect(service.isInessTokenValid()).resolves.toBeTruthy()
    await expect(service.checkInseeAuth()).resolves.toBeUndefined()
    await expect(service.getInseeToken()).resolves.toMatchObject({ token: '3b2f1a80-8ee8-4c40-920b-f98a1f6ce5c7' })
    MockDate.reset()
    return broker.stop()
  })
})

describe('Service actions', () => {
  const broker = new ServiceBroker({ logger: false })
  broker.createService(INSEESireneWithKeys)

  beforeAll(async () => {
    fetch.mockResponse(JSON.stringify({ access_token: '683fc2bc-4319-4b14-b687-0777e423602e', scope: 'am_application_scope default', token_type: 'Bearer', expires_in: 602025 }))
    await broker.start()
  })
  afterAll(() => broker.stop())
  beforeEach(() => fetch.resetMocks())

  describe('Siren', () => {
    it('siren given', async () => {
      const request = fetch.mockResponse(JSON.stringify(SirenFixture))
      await expect(broker.call('insee.sirene.siren', { siren: '831085675' })).resolves.toMatchObject({ header: { statut: 200 }, uniteLegale: { periodesUniteLegale: [{ denominationUniteLegale: 'YOURSOFT RUN' }] } })
      expect(request).toHaveBeenLastCalledWith('https://api.insee.fr/entreprises/sirene/V3/siren/831085675?', expect.anything())
      await expect(broker.call('insee.sirene.siren', { siren: '831085675', masquerValeursNulles: true })).resolves.toMatchObject({ header: { statut: 200 }, uniteLegale: { periodesUniteLegale: [{ denominationUniteLegale: 'YOURSOFT RUN' }] } })
      expect(request).toHaveBeenLastCalledWith('https://api.insee.fr/entreprises/sirene/V3/siren/831085675?masquerValeursNulles=true', expect.anything())
    })
    it('query given', async () => {
      const request = fetch.mockResponse(JSON.stringify(SirensFixture))
      await expect(broker.call('insee.sirene.siren', { date: '2019-04-27' })).resolves.toMatchObject({ header: { statut: 200, total: 2 } })
      expect(request).toHaveBeenLastCalledWith('https://api.insee.fr/entreprises/sirene/V3/siren', { method: 'POST', headers: expect.anything(), body: { date: '2019-04-27' } })
    })
  })
  describe('Siret', () => {
    it('siret given', async () => {
      const request = fetch.mockResponse(JSON.stringify(SiretFixture))
      await expect(broker.call('insee.sirene.siret', { siret: '83108567500013' })).resolves.toMatchObject({ header: { statut: 200 }, etablissement: { siret: '83108567500013' } })
      expect(request).toHaveBeenLastCalledWith('https://api.insee.fr/entreprises/sirene/V3/siret/83108567500013?', expect.anything())
      await expect(broker.call('insee.sirene.siret', { siret: '83108567500013', masquerValeursNulles: true })).resolves.toMatchObject({ header: { statut: 200 }, etablissement: { siret: '83108567500013' } })
      expect(request).toHaveBeenLastCalledWith('https://api.insee.fr/entreprises/sirene/V3/siret/83108567500013?masquerValeursNulles=true', expect.anything())
    })
    it('query given', async () => {
      const request = fetch.mockResponse(JSON.stringify(SiretsFixture))
      await expect(broker.call('insee.sirene.siret', { date: '2019-04-27' })).resolves.toMatchObject({ header: { statut: 200, total: 2 } })
      expect(request).toHaveBeenLastCalledWith('https://api.insee.fr/entreprises/sirene/V3/siret', { method: 'POST', headers: expect.anything(), body: { date: '2019-04-27' } })
    })
    it('succession', async () => {
      const request = fetch.mockResponse(JSON.stringify(SuccessionFixture))
      await expect(broker.call('insee.sirene.siret.succession', { nombre: 10 })).resolves.toMatchObject({ header: { statut: 200, total: 6858080 } })
      expect(request).toHaveBeenLastCalledWith('https://api.insee.fr/entreprises/sirene/V3/siret/liensSuccession?nombre=10', expect.anything())
    })
  })
  it('informations', async () => {
    const request = fetch.mockResponse(JSON.stringify(InformationsFixture))
    await expect(broker.call('insee.sirene.informations')).resolves.toMatchObject({ etatService: 'UP' })
    expect(request).toHaveBeenLastCalledWith('https://api.insee.fr/entreprises/sirene/V3/informations', expect.anything())
  })
})
