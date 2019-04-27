const fetch = require('node-fetch')
var MockDate = require('mockdate')
const { ServiceBroker } = require('moleculer')

const INSEESirene = require('../../index.js')

const INSEESireneWithKeys = { ...INSEESirene, settings: { keys: { key: 'key', secret: 'secret' } } }

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
    fetch.mockResponse(JSON.stringify({ error_description: "A valid OAuth client could not be found", error: "invalid_client" }), { status: 500 })
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
    fetch.mockResponse(JSON.stringify({ access_token: "683fc2bc-4319-4b14-b687-0777e423602e", scope: "am_application_scope default", token_type: "Bearer", expires_in: 602025 }))
    const broker = new ServiceBroker({ logger: false })
    const service = broker.createService(INSEESireneWithKeys)
    await broker.start()
    expect(service).toBeDefined()
    expect(await service.getInseeToken()).toMatchObject({ token: "683fc2bc-4319-4b14-b687-0777e423602e", expiry: (new Date()).getTime() + (602020 * 1000) })
    return broker.stop()
  })

  it('should login into insee API and refresh token', async () => {
    MockDate.set('04/27/2019')
    fetch.mockResponse(JSON.stringify({ access_token: "683fc2bc-4319-4b14-b687-0777e423602e", scope: "am_application_scope default", token_type: "Bearer", expires_in: 602025 }))
    const broker = new ServiceBroker({ logger: false })
    const service = broker.createService(INSEESireneWithKeys)
    await broker.start()
    expect(service).toBeDefined()
    expect(await service.getInseeToken()).toMatchObject({ token: "683fc2bc-4319-4b14-b687-0777e423602e", expiry: (new Date()).getTime() + (602020 * 1000) })
    expect(service.isInessTokenValid()).resolves.toBeTruthy()
    await expect(service.checkInseeAuth()).resolves.toBeUndefined()
    expect(await service.getInseeToken()).toMatchObject({ token: "683fc2bc-4319-4b14-b687-0777e423602e" })
    MockDate.set('05/27/2019')
    fetch.mockResponse(JSON.stringify({ access_token: "3b2f1a80-8ee8-4c40-920b-f98a1f6ce5c7", scope: "am_application_scope default", token_type: "Bearer", expires_in: 602025 }))
    expect(service.isInessTokenValid()).resolves.toBeFalsy()
    await expect(service.checkInseeAuth()).resolves.toBeUndefined()
    expect(await service.getInseeToken()).toMatchObject({ token: "3b2f1a80-8ee8-4c40-920b-f98a1f6ce5c7", expiry: (new Date()).getTime() + (602020 * 1000) })
    expect(service.isInessTokenValid()).resolves.toBeTruthy()
    await expect(service.checkInseeAuth()).resolves.toBeUndefined()
    expect(await service.getInseeToken()).toMatchObject({ token: "3b2f1a80-8ee8-4c40-920b-f98a1f6ce5c7" })
    return broker.stop()
  })
})

// describe('Service actions', () => {
//   it()
// })
