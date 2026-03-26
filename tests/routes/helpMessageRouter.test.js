
import request from 'supertest';
import express from 'express';

let mockController = {};

jest.mock('../../middleware/Verify.js', () => ({
  Verify: (req, res, next) => next(),
  VerifyRole: () => (req, res, next) => next()
}));

jest.mock('../../middleware/Validate.js', () => (req, res, next) => next());

jest.mock('../../controllers/helpmessageController.js', () => ({
  renderNew: (...args) => mockController.renderNew(...args),
  createNew: (...args) => mockController.createNew(...args),
  dashboard: (...args) => mockController.dashboard(...args),
  editGet: (...args) => mockController.editGet(...args),
  editPost: (...args) => mockController.editPost(...args),
  delete: (...args) => mockController.delete(...args)
}));


import helpMessageRouter from '../../routes/helpMessageRouter.js';

describe('helpMessageRouter', () => {

  let app;
  beforeAll(() => {
    mockController = {
      renderNew: jest.fn((req, res) => res.status(200).send('renderNew')),
      createNew: jest.fn((req, res) => res.status(201).send('createNew')),
      dashboard: jest.fn((req, res) => res.status(200).send('dashboard')),
      editGet: jest.fn((req, res) => res.status(200).send('editGet')),
      editPost: jest.fn((req, res) => res.status(200).send('editPost')),
      delete: jest.fn((req, res) => res.status(204).send('delete')),
    };
    app = express();
    app.use(express.json());
    app.use('/helpmessages', helpMessageRouter);
  });

  it('GET /helpmessages/new calls renderNew', async () => {
    const res = await request(app).get('/helpmessages/new');
    expect(res.status).toBe(200);
    expect(res.text).toBe('renderNew');
    expect(mockController.renderNew).toHaveBeenCalled();
  });

  it('POST /helpmessages/new calls createNew', async () => {
    const res = await request(app).post('/helpmessages/new').send({});
    expect(res.status).toBe(201);
    expect(res.text).toBe('createNew');
    expect(mockController.createNew).toHaveBeenCalled();
  });

  it('GET /helpmessages/dashboard calls dashboard', async () => {
    const res = await request(app).get('/helpmessages/dashboard');
    expect(res.status).toBe(200);
    expect(res.text).toBe('dashboard');
    expect(mockController.dashboard).toHaveBeenCalled();
  });

  it('GET /helpmessages/edit/:id calls editGet', async () => {
    const res = await request(app).get('/helpmessages/edit/123');
    expect(res.status).toBe(200);
    expect(res.text).toBe('editGet');
    expect(mockController.editGet).toHaveBeenCalled();
  });

  it('POST /helpmessages/edit/:id calls editPost', async () => {
    const res = await request(app).post('/helpmessages/edit/123').send({});
    expect(res.status).toBe(200);
    expect(res.text).toBe('editPost');
    expect(mockController.editPost).toHaveBeenCalled();
  });

  it('DELETE /helpmessages/delete/:id calls delete', async () => {
    const res = await request(app).delete('/helpmessages/delete/123');
    expect(res.status).toBe(204);
    expect(res.text).toBe(""); // 204 No Content should have empty body
    expect(mockController.delete).toHaveBeenCalled();
  });
});
