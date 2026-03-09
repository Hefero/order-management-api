
const request = require('supertest');
const app = require('./server');

describe('Orders API', () => {

  it('should list orders', async () => {
    const res = await request(app).get('/order/list');
    expect(res.statusCode).toBe(200);
  });

});
